from __future__ import annotations

from io import BytesIO
import re
from typing import Optional
import unicodedata

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.academic import Faculty, Specialty, University
from app.schemas.academic import (
    AcademicImportOut,
    FacultyIn,
    FacultyOut,
    FacultyUpdate,
    SpecialtyIn,
    SpecialtyListOut,
    SpecialtyOut,
    SpecialtyUpdate,
    UniversityIn,
    UniversityOut,
    UniversityUpdate,
)

try:
    from openpyxl import load_workbook
except ImportError:  # pragma: no cover - environment-dependent
    load_workbook = None


admin_router = APIRouter(prefix="/admin/academic", tags=["admin-academic"])
public_router = APIRouter(prefix="/academic", tags=["academic"])


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


def _match_col(headers: dict[str, int], keys: tuple[str, ...]) -> Optional[int]:
    for h, idx in headers.items():
        if any(k in h for k in keys):
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
        if has_spec and has_uni:
            return ridx, headers
    # fallback: row 1 as header if structured headers were not found
    headers = {_norm(_to_text(c) or ""): idx for idx, c in enumerate(rows[1] if len(rows) > 1 else rows[0])}
    return (1 if len(rows) > 1 else 0), headers


def _split_makon(raw: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """Parse «макон (шаҳр/ноҳия)» like «Душанбе / Сино» or single city name."""
    if not raw:
        return None, None
    t = str(raw).strip()
    if not t:
        return None, None
    if "/" in t:
        a, _, b = t.partition("/")
        return (a.strip() or None), (b.strip() or None)
    return t, None


def _extract_code_and_name(raw: str) -> tuple[Optional[str], str]:
    text = raw.strip()
    # Examples:
    # "225013201 - Автоматизатсияи кори бонк"
    # "2370104 Бухгалтер"
    m = re.match(r"^\s*([0-9A-Za-z\-_/]+)\s*[-:]\s*(.+)$", text)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    m2 = re.match(r"^\s*([0-9]{5,})\s+(.+)$", text)
    if m2:
        return m2.group(1).strip(), m2.group(2).strip()
    return None, text


@admin_router.get("/universities", response_model=list[UniversityOut])
def list_universities(db: Session = Depends(get_db)):
    rows = db.execute(select(University).order_by(University.name, University.id)).scalars().all()
    return [UniversityOut(id=r.id, name=r.name, city=r.city, district=r.district) for r in rows]


@admin_router.post("/universities", response_model=UniversityOut)
def create_university(body: UniversityIn, db: Session = Depends(get_db)):
    row = University(name=body.name.strip(), city=_to_text(body.city), district=_to_text(body.district))
    db.add(row)
    db.commit()
    db.refresh(row)
    return UniversityOut(id=row.id, name=row.name, city=row.city, district=row.district)


@admin_router.patch("/universities/{university_id}", response_model=UniversityOut)
def patch_university(university_id: int, body: UniversityUpdate, db: Session = Depends(get_db)):
    row = db.get(University, university_id)
    if not row:
        raise HTTPException(status_code=404, detail="University not found")
    data = body.model_dump(exclude_unset=True)
    if "name" in data and data["name"] is not None:
        row.name = data["name"].strip()
    if "city" in data:
        row.city = _to_text(data["city"])
    if "district" in data:
        row.district = _to_text(data["district"])
    db.commit()
    db.refresh(row)
    return UniversityOut(id=row.id, name=row.name, city=row.city, district=row.district)


@admin_router.delete("/universities/{university_id}", status_code=204)
def delete_university(university_id: int, db: Session = Depends(get_db)):
    row = db.get(University, university_id)
    if not row:
        raise HTTPException(status_code=404, detail="University not found")
    db.delete(row)
    db.commit()


@admin_router.get("/faculties", response_model=list[FacultyOut])
def list_faculties(
    university_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(Faculty)
    if university_id is not None:
        stmt = stmt.where(Faculty.university_id == university_id)
    stmt = stmt.order_by(Faculty.university_id, Faculty.name, Faculty.id)
    rows = db.execute(stmt).scalars().all()
    return [FacultyOut(id=r.id, university_id=r.university_id, name=r.name) for r in rows]


@admin_router.post("/faculties", response_model=FacultyOut)
def create_faculty(body: FacultyIn, db: Session = Depends(get_db)):
    if not db.get(University, body.university_id):
        raise HTTPException(status_code=404, detail="University not found")
    row = Faculty(university_id=body.university_id, name=body.name.strip())
    db.add(row)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Faculty already exists in this university") from e
    db.refresh(row)
    return FacultyOut(id=row.id, university_id=row.university_id, name=row.name)


@admin_router.patch("/faculties/{faculty_id}", response_model=FacultyOut)
def patch_faculty(faculty_id: int, body: FacultyUpdate, db: Session = Depends(get_db)):
    row = db.get(Faculty, faculty_id)
    if not row:
        raise HTTPException(status_code=404, detail="Faculty not found")
    data = body.model_dump(exclude_unset=True)
    if "university_id" in data and data["university_id"] is not None:
        if not db.get(University, data["university_id"]):
            raise HTTPException(status_code=404, detail="University not found")
        row.university_id = data["university_id"]
    if "name" in data and data["name"] is not None:
        row.name = data["name"].strip()
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Faculty already exists in this university") from e
    db.refresh(row)
    return FacultyOut(id=row.id, university_id=row.university_id, name=row.name)


@admin_router.delete("/faculties/{faculty_id}", status_code=204)
def delete_faculty(faculty_id: int, db: Session = Depends(get_db)):
    row = db.get(Faculty, faculty_id)
    if not row:
        raise HTTPException(status_code=404, detail="Faculty not found")
    db.delete(row)
    db.commit()


def _specialty_row_to_out(row: Specialty, faculty_name: str, university_id: int, university_name: str, city: Optional[str], district: Optional[str]) -> SpecialtyListOut:
    return SpecialtyListOut(
        id=row.id,
        faculty_id=row.faculty_id,
        code=row.code,
        name=row.name,
        study_mode=row.study_mode,
        language=row.language,
        tuition=row.tuition,
        admission_quota=row.admission_quota,
        source_sheet=row.source_sheet,
        faculty_name=faculty_name,
        university_id=university_id,
        university_name=university_name,
        city=city,
        district=district,
    )


@admin_router.get("/specialties", response_model=list[SpecialtyListOut])
@public_router.get("/specialties", response_model=list[SpecialtyListOut])
def list_specialties(
    university_id: Optional[int] = Query(default=None),
    faculty_id: Optional[int] = Query(default=None),
    specialty_id: Optional[int] = Query(default=None),
    samt: Optional[str] = Query(default=None, description="Факультет / самт — частичное совпадение"),
    university: Optional[str] = Query(default=None, description="Название муассиса — частичное совпадение"),
    makon: Optional[str] = Query(default=None, description="Город или район / колонка макон"),
    code_name: Optional[str] = Query(default=None, description="Рамз ё номи ихтисос"),
    study_mode: Optional[str] = Query(default=None),
    tuition: Optional[str] = Query(default=None, description="Намуди таҳсил / маблағ"),
    language: Optional[str] = Query(default=None),
    admission_quota: Optional[str] = Query(default=None, description="Нақшаи қабул"),
    q: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Specialty, Faculty.name, University.id, University.name, University.city, University.district)
        .join(Faculty, Faculty.id == Specialty.faculty_id)
        .join(University, University.id == Faculty.university_id)
    )
    if specialty_id is not None:
        stmt = stmt.where(Specialty.id == specialty_id)
    if university_id is not None:
        stmt = stmt.where(University.id == university_id)
    if faculty_id is not None:
        stmt = stmt.where(Faculty.id == faculty_id)
    if samt and samt.strip():
        term = f"%{samt.strip().lower()}%"
        stmt = stmt.where(func.lower(Faculty.name).like(term))
    if university and university.strip():
        term = f"%{university.strip().lower()}%"
        stmt = stmt.where(func.lower(University.name).like(term))
    if makon and makon.strip():
        term = f"%{makon.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(func.coalesce(University.city, "")).like(term),
                func.lower(func.coalesce(University.district, "")).like(term),
                func.lower(
                    func.trim(
                        func.concat_ws(
                            " ",
                            func.coalesce(University.city, ""),
                            func.coalesce(University.district, ""),
                        )
                    )
                ).like(term),
            )
        )
    if code_name and code_name.strip():
        term = f"%{code_name.strip().lower()}%"
        stmt = stmt.where(
            func.lower(Specialty.name).like(term) | func.lower(func.coalesce(Specialty.code, "")).like(term)
        )
    if study_mode and study_mode.strip():
        term = f"%{study_mode.strip().lower()}%"
        stmt = stmt.where(func.lower(func.coalesce(Specialty.study_mode, "")).like(term))
    if tuition and tuition.strip():
        term = f"%{tuition.strip().lower()}%"
        stmt = stmt.where(func.lower(func.coalesce(Specialty.tuition, "")).like(term))
    if language and language.strip():
        term = f"%{language.strip().lower()}%"
        stmt = stmt.where(func.lower(func.coalesce(Specialty.language, "")).like(term))
    if admission_quota and admission_quota.strip():
        term = f"%{admission_quota.strip().lower()}%"
        stmt = stmt.where(func.lower(func.coalesce(Specialty.admission_quota, "")).like(term))
    if q:
        term = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            func.lower(Specialty.name).like(term)
            | func.lower(func.coalesce(Specialty.code, "")).like(term)
            | func.lower(Faculty.name).like(term)
            | func.lower(University.name).like(term)
        )
    stmt = stmt.order_by(University.name, Faculty.name, Specialty.name, Specialty.id)
    rows = db.execute(stmt).all()
    return [_specialty_row_to_out(*r) for r in rows]


@admin_router.post("/specialties", response_model=SpecialtyOut)
def create_specialty(body: SpecialtyIn, db: Session = Depends(get_db)):
    if not db.get(Faculty, body.faculty_id):
        raise HTTPException(status_code=404, detail="Faculty not found")
    row = Specialty(
        faculty_id=body.faculty_id,
        code=_to_text(body.code),
        name=body.name.strip(),
        study_mode=_to_text(body.study_mode),
        language=_to_text(body.language),
        tuition=_to_text(body.tuition),
        admission_quota=_to_text(body.admission_quota),
        source_sheet=_to_text(body.source_sheet),
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Specialty already exists in this faculty") from e
    db.refresh(row)
    return SpecialtyOut(
        id=row.id,
        faculty_id=row.faculty_id,
        code=row.code,
        name=row.name,
        study_mode=row.study_mode,
        language=row.language,
        tuition=row.tuition,
        admission_quota=row.admission_quota,
        source_sheet=row.source_sheet,
    )


@admin_router.patch("/specialties/{specialty_id}", response_model=SpecialtyOut)
def patch_specialty(specialty_id: int, body: SpecialtyUpdate, db: Session = Depends(get_db)):
    row = db.get(Specialty, specialty_id)
    if not row:
        raise HTTPException(status_code=404, detail="Specialty not found")
    data = body.model_dump(exclude_unset=True)
    if "faculty_id" in data and data["faculty_id"] is not None:
        if not db.get(Faculty, data["faculty_id"]):
            raise HTTPException(status_code=404, detail="Faculty not found")
        row.faculty_id = data["faculty_id"]
    if "code" in data:
        row.code = _to_text(data["code"])
    if "name" in data and data["name"] is not None:
        row.name = data["name"].strip()
    if "study_mode" in data:
        row.study_mode = _to_text(data["study_mode"])
    if "language" in data:
        row.language = _to_text(data["language"])
    if "tuition" in data:
        row.tuition = _to_text(data["tuition"])
    if "admission_quota" in data:
        row.admission_quota = _to_text(data["admission_quota"])
    if "source_sheet" in data:
        row.source_sheet = _to_text(data["source_sheet"])
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Specialty already exists in this faculty") from e
    db.refresh(row)
    return SpecialtyOut(
        id=row.id,
        faculty_id=row.faculty_id,
        code=row.code,
        name=row.name,
        study_mode=row.study_mode,
        language=row.language,
        tuition=row.tuition,
        admission_quota=row.admission_quota,
        source_sheet=row.source_sheet,
    )


@admin_router.delete("/specialties/{specialty_id}", status_code=204)
def delete_specialty(specialty_id: int, db: Session = Depends(get_db)):
    row = db.get(Specialty, specialty_id)
    if not row:
        raise HTTPException(status_code=404, detail="Specialty not found")
    db.delete(row)
    db.commit()


@admin_router.post("/import", response_model=AcademicImportOut)
async def import_academic_excel(
    file: UploadFile = File(...),
    clear_existing: bool = Form(default=False),
    db: Session = Depends(get_db),
):
    if load_workbook is None:
        raise HTTPException(status_code=500, detail="openpyxl is required for Excel import")
    if not (file.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")

    raw = await file.read()
    try:
        wb = load_workbook(filename=BytesIO(raw), data_only=True)
    except Exception as e:  # pragma: no cover - input dependent
        raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {e}") from e

    if clear_existing:
        db.query(Specialty).delete()
        db.query(Faculty).delete()
        db.query(University).delete()
        db.flush()

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

    uni_cache: dict[tuple[str, str, str], University] = {}
    fac_cache: dict[tuple[int, str], Faculty] = {}
    spec_cache: dict[tuple[int, str, str], Specialty] = {}

    for sheet in wb.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        if len(rows) < 2:
            continue
        stats["sheets_read"] += 1
        header_idx, headers = _detect_header_row(rows)

        c_fac = _match_col(headers, ("самт", "fakult", "faculty", "cluster"))
        c_spec = _match_col(headers, ("ихтисос", "ixtisos", "special", "номи ихтисос"))
        c_uni = _match_col(headers, ("муассис", "донишгох", "univers", "college"))
        c_city = _match_col(headers, ("шахр", "шаҳр", "город", "city"))
        c_dist = _match_col(headers, ("нохия", "ноҳия", "район", "district"))
        c_makon = _match_col(headers, ("мақон", "макон", "макони", "location"))
        c_mode = _match_col(headers, ("шакли", "шакл", "mode", "form"))
        c_lang = _match_col(headers, ("забони", "забон", "language"))
        c_tuition = _match_col(headers, ("намуди", "намуд", "сомон", "маблағ", "пулаки", "пул", "оплат", "tuition", "cost"))
        c_admission = _match_col(headers, ("нақша", "қабул", "plan", "quota"))
        c_code = _match_col(headers, ("рамз", "code"))

        for row in rows[header_idx + 1 :]:
            stats["rows_seen"] += 1
            uni_name = _to_text(row[c_uni]) if c_uni is not None and c_uni < len(row) else None
            fac_name = _to_text(row[c_fac]) if c_fac is not None and c_fac < len(row) else None
            spec_raw = _to_text(row[c_spec]) if c_spec is not None and c_spec < len(row) else None
            if not uni_name or not spec_raw:
                stats["skipped_rows"] += 1
                continue

            code = _to_text(row[c_code]) if c_code is not None and c_code < len(row) else None
            parsed_code, parsed_name = _extract_code_and_name(spec_raw)
            spec_name = parsed_name
            code = code or parsed_code
            city = _to_text(row[c_city]) if c_city is not None and c_city < len(row) else None
            district = _to_text(row[c_dist]) if c_dist is not None and c_dist < len(row) else None
            if c_makon is not None and c_makon < len(row):
                mk = _to_text(row[c_makon])
                if mk:
                    mc, md = _split_makon(mk)
                    city = city or mc
                    district = district or md
            study_mode = _to_text(row[c_mode]) if c_mode is not None and c_mode < len(row) else None
            language = _to_text(row[c_lang]) if c_lang is not None and c_lang < len(row) else None
            tuition = _to_text(row[c_tuition]) if c_tuition is not None and c_tuition < len(row) else None
            admission = _to_text(row[c_admission]) if c_admission is not None and c_admission < len(row) else None
            fac_name = fac_name or sheet.title

            u_key = (_norm(uni_name), _norm(city or ""), _norm(district or ""))
            uni = uni_cache.get(u_key)
            if uni is None:
                uni = db.execute(
                    select(University).where(
                        func.lower(University.name) == uni_name.strip().lower(),
                        func.lower(func.coalesce(University.city, "")) == (city or "").strip().lower(),
                        func.lower(func.coalesce(University.district, "")) == (district or "").strip().lower(),
                    )
                ).scalar_one_or_none()
                if uni is None:
                    uni = University(name=uni_name.strip(), city=city, district=district)
                    db.add(uni)
                    db.flush()
                    stats["universities_created"] += 1
                uni_cache[u_key] = uni

            f_key = (uni.id, _norm(fac_name))
            fac = fac_cache.get(f_key)
            if fac is None:
                fac = db.execute(
                    select(Faculty).where(
                        Faculty.university_id == uni.id,
                        func.lower(Faculty.name) == fac_name.strip().lower(),
                    )
                ).scalar_one_or_none()
                if fac is None:
                    fac = Faculty(university_id=uni.id, name=fac_name.strip())
                    db.add(fac)
                    db.flush()
                    stats["faculties_created"] += 1
                fac_cache[f_key] = fac

            s_key = (fac.id, _norm(spec_name), _norm(code or ""))
            spec = spec_cache.get(s_key)
            if spec is None:
                spec = db.execute(
                    select(Specialty).where(
                        Specialty.faculty_id == fac.id,
                        func.lower(Specialty.name) == spec_name.strip().lower(),
                        func.lower(func.coalesce(Specialty.code, "")) == (code or "").strip().lower(),
                    )
                ).scalar_one_or_none()
                if spec is None:
                    spec = Specialty(
                        faculty_id=fac.id,
                        code=code,
                        name=spec_name.strip(),
                        study_mode=study_mode,
                        language=language,
                        tuition=tuition,
                        admission_quota=admission,
                        source_sheet=sheet.title,
                    )
                    db.add(spec)
                    db.flush()
                    stats["specialties_created"] += 1
                else:
                    spec.study_mode = study_mode or spec.study_mode
                    spec.language = language or spec.language
                    spec.tuition = tuition or spec.tuition
                    spec.admission_quota = admission or spec.admission_quota
                    spec.source_sheet = sheet.title
                    stats["specialties_updated"] += 1
                spec_cache[s_key] = spec
            else:
                spec.study_mode = study_mode or spec.study_mode
                spec.language = language or spec.language
                spec.tuition = tuition or spec.tuition
                spec.admission_quota = admission or spec.admission_quota
                spec.source_sheet = sheet.title
                stats["specialties_updated"] += 1

            stats["rows_imported"] += 1

    db.commit()
    return AcademicImportOut(**stats)
