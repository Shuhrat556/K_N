from __future__ import annotations

import hashlib
import re
import unicodedata
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.academic import Faculty, Specialty, University


def _norm(value: Optional[str]) -> str:
    if value is None:
        return ""
    text = str(value).strip().lower()
    text = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in text if not unicodedata.combining(ch))


def _to_text(value: object) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _to_int(value: object) -> Optional[int]:
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    text = str(value).strip()
    if not text:
        return None
    digits = re.sub(r"[^\d-]", "", text)
    if not digits or digits == "-":
        return None
    try:
        return int(digits)
    except ValueError:
        return None


def _match_col(headers: dict[str, int], keys: tuple[str, ...]) -> Optional[int]:
    for header, idx in headers.items():
        if any(key in header for key in keys):
            return idx
    return None


def _detect_header_row(rows: list[tuple[object, ...]]) -> tuple[int, dict[str, int]]:
    for ridx, row in enumerate(rows[:12]):
        headers: dict[str, int] = {}
        for cidx, cell in enumerate(row):
            tx = _norm(_to_text(cell))
            if tx:
                headers[tx] = cidx
        if not headers:
            continue
        has_spec = any("ихтисос" in h or "ixtisos" in h or "special" in h for h in headers)
        has_uni = any("муассис" in h or "донишгох" in h or "univers" in h for h in headers)
        if has_spec and has_uni and len(headers) >= 5:
            return ridx, headers
    headers = {_norm(_to_text(c) or ""): idx for idx, c in enumerate(rows[1] if len(rows) > 1 else rows[0])}
    return (1 if len(rows) > 1 else 0), headers


def _split_makon(raw: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    if not raw:
        return None, None
    text = str(raw).strip()
    if not text:
        return None, None
    for separator in ("/", " / ", " - ", " – ", ","):
        if separator in text:
            left, _, right = text.partition(separator)
            return (left.strip() or None), (right.strip() or None)
    return text, None


def _extract_code_and_name(raw: str) -> tuple[Optional[str], str]:
    text = raw.strip()
    match = re.match(r"^\s*([0-9A-Za-z\-_/]+)\s*[-:]\s*(.+)$", text)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    match = re.match(r"^\s*([0-9]{5,})\s+(.+)$", text)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return None, text


def _parse_tuition(raw: Optional[str]) -> tuple[Optional[bool], Optional[int]]:
    if not raw:
        return None, None
    text = str(raw).strip()
    if not text:
        return None, None

    normalized = _norm(text)
    is_free: Optional[bool]
    if "ройгон" in normalized or "бепул" in normalized or "free" in normalized:
        is_free = True
    elif "пулак" in normalized or "шартном" in normalized or "paid" in normalized:
        is_free = False
    else:
        is_free = None

    bracket_match = re.search(r"\(([^)]*)\)", text)
    digits_source = bracket_match.group(1) if bracket_match else text
    digits = re.sub(r"\D", "", digits_source)
    price = int(digits) if digits else None
    if is_free is True and price == 0:
        price = None
    return is_free, price


def _parse_group_title(raw_title: Optional[str], fallback_code: str) -> str:
    title = _to_text(raw_title) or fallback_code
    quoted = re.search(r"[\"“”«](.*?)[\"“”»]", title)
    if quoted and quoted.group(1).strip():
        return quoted.group(1).strip()
    if "–" in title:
        _, _, tail = title.partition("–")
        if tail.strip():
            return tail.strip(" -–—\"“”«»")
    return title.strip()


def _is_roster_sheet(title: str) -> bool:
    normalized = _norm(title)
    return "руйхати" in normalized or ("мток" in normalized and "мтмк" in normalized)


def build_specialty_entry_key(
    *,
    excel_id: int | None,
    faculty_id: int,
    code: str | None,
    name: str,
    study_mode: str | None,
    language: str | None,
    tuition: str | None,
    admission_quota: str | None,
    degree: str | None,
) -> str:
    payload = "|".join(
        [
            str(excel_id or ""),
            str(faculty_id),
            _norm(code),
            _norm(name),
            _norm(study_mode),
            _norm(language),
            _norm(tuition),
            _norm(admission_quota),
            _norm(degree),
        ]
    )
    digest = hashlib.sha1(payload.encode("utf-8")).hexdigest()
    return f"specialty:{digest}"


class AcademicImportService:
    def __init__(self, db: Session):
        self.db = db

    def import_workbook(self, workbook: Any, *, clear_existing: bool = False) -> dict[str, int]:
        if clear_existing:
            self.db.query(Specialty).delete()
            self.db.query(Faculty).delete()
            self.db.query(University).delete()
            self.db.flush()

        stats = {
            "sheets_read": 0,
            "rows_seen": 0,
            "rows_imported": 0,
            "universities_created": 0,
            "faculties_created": 0,
            "specialties_created": 0,
            "specialties_updated": 0,
            "skipped_rows": 0,
        }

        roster_sheet = next((sheet for sheet in workbook.worksheets if _is_roster_sheet(sheet.title)), None)
        university_cache: dict[str, University] = {
            _norm(university.name): university
            for university in self.db.execute(select(University)).scalars().all()
            if university.name
        }
        faculty_cache: dict[tuple[int, str], Faculty] = {
            (faculty.university_id, _norm(faculty.code or faculty.name)): faculty
            for faculty in self.db.execute(select(Faculty)).scalars().all()
            if faculty.name
        }
        specialty_cache: dict[str, Specialty] = {
            specialty.entry_key: specialty
            for specialty in self.db.execute(select(Specialty)).scalars().all()
            if specialty.entry_key
        }

        roster_map: dict[str, dict[str, Any]] = {}
        if roster_sheet is not None:
            stats["sheets_read"] += 1
            roster_map = self._read_roster(roster_sheet)
            for name_key, meta in roster_map.items():
                self._get_or_create_university(
                    name=meta["name"],
                    city=meta.get("city"),
                    district=meta.get("district"),
                    region=meta.get("region"),
                    phone=meta.get("phone"),
                    serial_no=meta.get("serial_no"),
                    source_sheet=roster_sheet.title,
                    cache=university_cache,
                    stats=stats,
                )

        for sheet in workbook.worksheets:
            if roster_sheet is not None and sheet.title == roster_sheet.title:
                continue

            preview_rows = list(sheet.iter_rows(min_row=1, max_row=min(sheet.max_row or 0, 12), values_only=True))
            if len(preview_rows) < 2:
                continue

            stats["sheets_read"] += 1
            header_idx, headers = _detect_header_row(preview_rows)
            group_code = _to_text(sheet.title) or "GROUP"
            group_title = _parse_group_title(
                _to_text(preview_rows[0][0]) if preview_rows and preview_rows[0] else None,
                group_code,
            )

            c_id = _match_col(headers, ("id",))
            c_spec = _match_col(headers, ("ихтисос", "ixtisos", "special", "номи ихтисос", "рамз ва ном"))
            c_uni = _match_col(headers, ("муассис", "донишгох", "univers", "college"))
            c_city = _match_col(headers, ("шахр", "шаҳр", "город", "city"))
            c_dist = _match_col(headers, ("нохия", "ноҳия", "район", "district"))
            c_makon = _match_col(headers, ("мақон", "макон", "макони", "location"))
            c_mode = _match_col(headers, ("шакли", "шакл", "mode", "form"))
            c_lang = _match_col(headers, ("забони", "забон", "language"))
            c_tuition = _match_col(
                headers,
                ("намуди", "намуд", "сомон", "маблағ", "пулаки", "пул", "оплат", "tuition", "cost"),
            )
            c_admission = _match_col(headers, ("нақша", "қабул", "plan", "quota"))
            c_degree = _match_col(headers, ("дараҷа", "степ", "degree", "ток", "тмк"))
            c_code = _match_col(headers, ("рамз", "code"))

            for row in sheet.iter_rows(min_row=header_idx + 2, values_only=True):
                stats["rows_seen"] += 1
                university_name = _to_text(row[c_uni]) if c_uni is not None and c_uni < len(row) else None
                specialty_raw = _to_text(row[c_spec]) if c_spec is not None and c_spec < len(row) else None
                if not university_name or not specialty_raw:
                    stats["skipped_rows"] += 1
                    continue

                excel_id = _to_int(row[c_id]) if c_id is not None and c_id < len(row) else None
                code = _to_text(row[c_code]) if c_code is not None and c_code < len(row) else None
                parsed_code, specialty_name = _extract_code_and_name(specialty_raw)
                code = code or parsed_code

                city = _to_text(row[c_city]) if c_city is not None and c_city < len(row) else None
                district = _to_text(row[c_dist]) if c_dist is not None and c_dist < len(row) else None
                if c_makon is not None and c_makon < len(row):
                    makon_city, makon_district = _split_makon(_to_text(row[c_makon]))
                    city = city or makon_city
                    district = district or makon_district

                roster_meta = roster_map.get(_norm(university_name), {})
                city = city or roster_meta.get("city")
                district = district or roster_meta.get("district")

                study_mode = _to_text(row[c_mode]) if c_mode is not None and c_mode < len(row) else None
                language = _to_text(row[c_lang]) if c_lang is not None and c_lang < len(row) else None
                tuition = _to_text(row[c_tuition]) if c_tuition is not None and c_tuition < len(row) else None
                admission_quota = _to_text(row[c_admission]) if c_admission is not None and c_admission < len(row) else None
                degree = _to_text(row[c_degree]) if c_degree is not None and c_degree < len(row) else None
                is_free, price = _parse_tuition(tuition)

                university = self._get_or_create_university(
                    name=university_name,
                    city=city,
                    district=district,
                    region=roster_meta.get("region"),
                    phone=roster_meta.get("phone"),
                    serial_no=roster_meta.get("serial_no"),
                    source_sheet=roster_sheet.title if roster_sheet is not None else sheet.title,
                    cache=university_cache,
                    stats=stats,
                )
                faculty = self._get_or_create_faculty(
                    university=university,
                    code=group_code,
                    name=group_title,
                    source_sheet=sheet.title,
                    cache=faculty_cache,
                    stats=stats,
                )

                entry_key = build_specialty_entry_key(
                    excel_id=excel_id,
                    faculty_id=faculty.id,
                    code=code,
                    name=specialty_name,
                    study_mode=study_mode,
                    language=language,
                    tuition=tuition,
                    admission_quota=admission_quota,
                    degree=degree,
                )

                specialty = specialty_cache.get(entry_key)
                if specialty is None:
                    specialty = self.db.execute(select(Specialty).where(Specialty.entry_key == entry_key)).scalar_one_or_none()

                if specialty is None:
                    specialty = Specialty(
                        faculty_id=faculty.id,
                        excel_id=excel_id,
                        entry_key=entry_key,
                        code=code,
                        name=specialty_name,
                        study_mode=study_mode,
                        language=language,
                        tuition=tuition,
                        admission_quota=admission_quota,
                        degree=degree,
                        is_free=is_free,
                        price=price,
                        source_sheet=sheet.title,
                    )
                    self.db.add(specialty)
                    self.db.flush()
                    stats["specialties_created"] += 1
                else:
                    specialty.faculty_id = faculty.id
                    specialty.excel_id = excel_id
                    specialty.entry_key = entry_key
                    specialty.code = code
                    specialty.name = specialty_name
                    specialty.study_mode = study_mode
                    specialty.language = language
                    specialty.tuition = tuition
                    specialty.admission_quota = admission_quota
                    specialty.degree = degree
                    specialty.is_free = is_free
                    specialty.price = price
                    specialty.source_sheet = sheet.title
                    stats["specialties_updated"] += 1

                specialty_cache[entry_key] = specialty
                stats["rows_imported"] += 1

        return stats

    def _read_roster(self, sheet: Any) -> dict[str, dict[str, Any]]:
        preview_rows = list(sheet.iter_rows(min_row=1, max_row=min(sheet.max_row or 0, 10), values_only=True))
        if not preview_rows:
            return {}

        header_idx = 0
        headers: dict[str, int] = {}
        for ridx, row in enumerate(preview_rows):
            current = {}
            for cidx, cell in enumerate(row):
                tx = _norm(_to_text(cell))
                if tx:
                    current[tx] = cidx
            if current and any("вилоят" in key for key in current) and any("ном" == key or "ном" in key for key in current):
                header_idx = ridx
                headers = current
                break
        if not headers:
            return {}

        c_serial = _match_col(headers, ("№", "no", "serial"))
        c_region = _match_col(headers, ("вилоят", "region"))
        c_name = _match_col(headers, ("ном", "name"))
        c_makon = _match_col(headers, ("макон", "макон", "шаҳр", "ноҳия", "location"))
        c_phone = _match_col(headers, ("телефон", "phone"))

        roster: dict[str, dict[str, Any]] = {}
        for row in sheet.iter_rows(min_row=header_idx + 2, values_only=True):
            name = _to_text(row[c_name]) if c_name is not None and c_name < len(row) else None
            if not name:
                continue
            makon = _to_text(row[c_makon]) if c_makon is not None and c_makon < len(row) else None
            city, district = _split_makon(makon)
            roster[_norm(name)] = {
                "serial_no": _to_int(row[c_serial]) if c_serial is not None and c_serial < len(row) else None,
                "region": _to_text(row[c_region]) if c_region is not None and c_region < len(row) else None,
                "name": name,
                "city": city,
                "district": district,
                "phone": _to_text(row[c_phone]) if c_phone is not None and c_phone < len(row) else None,
            }
        return roster

    def _get_or_create_university(
        self,
        *,
        name: str,
        city: str | None,
        district: str | None,
        region: str | None,
        phone: str | None,
        serial_no: int | None,
        source_sheet: str | None,
        cache: dict[str, University],
        stats: dict[str, int],
    ) -> University:
        cache_key = _norm(name)
        university = cache.get(cache_key)
        if university is None:
            university = self.db.execute(select(University).where(University.name == name.strip())).scalar_one_or_none()
            if university is None:
                university = University(
                    name=name.strip(),
                    city=city,
                    district=district,
                    region=region,
                    phone=phone,
                    serial_no=serial_no,
                    source_sheet=source_sheet,
                )
                self.db.add(university)
                self.db.flush()
                stats["universities_created"] += 1
            cache[cache_key] = university

        if city and city != university.city:
            university.city = city
        if district and district != university.district:
            university.district = district
        if region and region != university.region:
            university.region = region
        if phone and phone != university.phone:
            university.phone = phone
        if serial_no is not None:
            university.serial_no = serial_no
        if source_sheet:
            university.source_sheet = source_sheet
        return university

    def _get_or_create_faculty(
        self,
        *,
        university: University,
        code: str | None,
        name: str,
        source_sheet: str | None,
        cache: dict[tuple[int, str], Faculty],
        stats: dict[str, int],
    ) -> Faculty:
        cache_key = (university.id, _norm(code or name))
        faculty = cache.get(cache_key)
        if faculty is None:
            stmt = select(Faculty).where(Faculty.university_id == university.id)
            candidates = self.db.execute(stmt).scalars().all()
            wanted_code = _norm(code)
            wanted_name = _norm(name)
            faculty = next(
                (
                    candidate
                    for candidate in candidates
                    if _norm(candidate.code) == wanted_code or _norm(candidate.name) == wanted_name
                ),
                None,
            )
            if faculty is None:
                faculty = Faculty(
                    university_id=university.id,
                    code=code,
                    name=name.strip(),
                    source_sheet=source_sheet,
                )
                self.db.add(faculty)
                self.db.flush()
                stats["faculties_created"] += 1
            cache[cache_key] = faculty

        faculty.code = code or faculty.code
        faculty.name = name.strip() or faculty.name
        if source_sheet:
            faculty.source_sheet = source_sheet
        return faculty
