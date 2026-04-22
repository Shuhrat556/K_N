from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class UniversityIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    city: Optional[str] = Field(default=None, max_length=128)
    district: Optional[str] = Field(default=None, max_length=128)


class UniversityUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    city: Optional[str] = Field(default=None, max_length=128)
    district: Optional[str] = Field(default=None, max_length=128)


class UniversityOut(BaseModel):
    id: int
    name: str
    city: Optional[str] = None
    district: Optional[str] = None


class FacultyIn(BaseModel):
    university_id: int
    name: str = Field(min_length=1, max_length=255)


class FacultyUpdate(BaseModel):
    university_id: Optional[int] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)


class FacultyOut(BaseModel):
    id: int
    university_id: int
    name: str


class SpecialtyIn(BaseModel):
    faculty_id: int
    code: Optional[str] = Field(default=None, max_length=128)
    name: str = Field(min_length=1)
    study_mode: Optional[str] = Field(default=None, max_length=128)
    language: Optional[str] = Field(default=None, max_length=128)
    tuition: Optional[str] = Field(default=None, max_length=128)
    source_sheet: Optional[str] = Field(default=None, max_length=255)


class SpecialtyUpdate(BaseModel):
    faculty_id: Optional[int] = None
    code: Optional[str] = Field(default=None, max_length=128)
    name: Optional[str] = Field(default=None, min_length=1)
    study_mode: Optional[str] = Field(default=None, max_length=128)
    language: Optional[str] = Field(default=None, max_length=128)
    tuition: Optional[str] = Field(default=None, max_length=128)
    source_sheet: Optional[str] = Field(default=None, max_length=255)


class SpecialtyOut(BaseModel):
    id: int
    faculty_id: int
    code: Optional[str] = None
    name: str
    study_mode: Optional[str] = None
    language: Optional[str] = None
    tuition: Optional[str] = None
    source_sheet: Optional[str] = None


class SpecialtyListOut(SpecialtyOut):
    faculty_name: str
    university_id: int
    university_name: str
    city: Optional[str] = None
    district: Optional[str] = None


class AcademicImportOut(BaseModel):
    sheets_read: int
    rows_seen: int
    rows_imported: int
    universities_created: int
    faculties_created: int
    specialties_created: int
    specialties_updated: int
    skipped_rows: int
