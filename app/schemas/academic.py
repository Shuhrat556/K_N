from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class UniversityIn(BaseModel):
    serial_no: Optional[int] = None
    name: str = Field(min_length=1, max_length=255)
    region: Optional[str] = Field(default=None, max_length=128)
    city: Optional[str] = Field(default=None, max_length=128)
    district: Optional[str] = Field(default=None, max_length=128)
    phone: Optional[str] = Field(default=None, max_length=128)


class UniversityUpdate(BaseModel):
    serial_no: Optional[int] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    region: Optional[str] = Field(default=None, max_length=128)
    city: Optional[str] = Field(default=None, max_length=128)
    district: Optional[str] = Field(default=None, max_length=128)
    phone: Optional[str] = Field(default=None, max_length=128)


class UniversityOut(BaseModel):
    id: int
    serial_no: Optional[int] = None
    name: str
    region: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    phone: Optional[str] = None


class FacultyIn(BaseModel):
    university_id: int
    code: Optional[str] = Field(default=None, max_length=32)
    name: str = Field(min_length=1, max_length=255)
    source_sheet: Optional[str] = Field(default=None, max_length=255)


class FacultyUpdate(BaseModel):
    university_id: Optional[int] = None
    code: Optional[str] = Field(default=None, max_length=32)
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    source_sheet: Optional[str] = Field(default=None, max_length=255)


class FacultyOut(BaseModel):
    id: int
    university_id: int
    code: Optional[str] = None
    name: str
    source_sheet: Optional[str] = None
    university_name: Optional[str] = None


class SpecialtyIn(BaseModel):
    faculty_id: int
    excel_id: Optional[int] = None
    code: Optional[str] = Field(default=None, max_length=128)
    name: str = Field(min_length=1)
    study_mode: Optional[str] = Field(default=None, max_length=128)
    language: Optional[str] = Field(default=None, max_length=128)
    tuition: Optional[str] = Field(default=None, max_length=128)
    admission_quota: Optional[str] = Field(default=None, max_length=512)
    degree: Optional[str] = Field(default=None, max_length=255)
    is_free: Optional[bool] = None
    price: Optional[int] = None
    source_sheet: Optional[str] = Field(default=None, max_length=255)


class SpecialtyUpdate(BaseModel):
    faculty_id: Optional[int] = None
    excel_id: Optional[int] = None
    code: Optional[str] = Field(default=None, max_length=128)
    name: Optional[str] = Field(default=None, min_length=1)
    study_mode: Optional[str] = Field(default=None, max_length=128)
    language: Optional[str] = Field(default=None, max_length=128)
    tuition: Optional[str] = Field(default=None, max_length=128)
    admission_quota: Optional[str] = Field(default=None, max_length=512)
    degree: Optional[str] = Field(default=None, max_length=255)
    is_free: Optional[bool] = None
    price: Optional[int] = None
    source_sheet: Optional[str] = Field(default=None, max_length=255)


class SpecialtyOut(BaseModel):
    id: int
    faculty_id: int
    excel_id: Optional[int] = None
    code: Optional[str] = None
    name: str
    study_mode: Optional[str] = None
    language: Optional[str] = None
    tuition: Optional[str] = None
    admission_quota: Optional[str] = None
    degree: Optional[str] = None
    is_free: Optional[bool] = None
    price: Optional[int] = None
    source_sheet: Optional[str] = None


class SpecialtyListOut(SpecialtyOut):
    faculty_name: str
    faculty_code: Optional[str] = None
    university_id: int
    university_name: str
    region: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    phone: Optional[str] = None


class SpecialtyPageOut(BaseModel):
    data: list[SpecialtyListOut]
    page: int
    limit: int
    total: int
    total_pages: int


class SpecialtyStatsOut(BaseModel):
    total_specialties: int
    universities_count: int
    faculties_count: int
    languages_count: int
    study_modes_count: int
    free_count: int
    paid_count: int


class AcademicImportOut(BaseModel):
    sheets_read: int
    rows_seen: int
    rows_imported: int
    universities_created: int
    faculties_created: int
    specialties_created: int
    specialties_updated: int
    skipped_rows: int
