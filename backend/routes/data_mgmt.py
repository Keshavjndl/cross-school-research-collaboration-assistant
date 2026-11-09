import io
import csv
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.database.models import Researcher, Publication, School

router = APIRouter(prefix="/data", tags=["Data Management"])

RESEARCHER_SAMPLE_CSV = """name,email,school_code,designation,bio,research_interests,skills,h_index,total_citations
Dr. Maya Sharma,maya.sharma@university.edu,SCSE,Associate Professor,Specializes in federated edge computing and IoT security.,"Computer Vision, Cybersecurity & Cryptography","PyTorch, Docker, Edge Computing",14,890
Dr. Vivek Murthy,vivek.murthy@university.edu,SBBS,Professor,Focuses on microbial metagenomics and plant biostimulants.,"Bioinformatics & Genomics, Precision Agriculture","Metagenomics, NGS, PCR",22,2100
"""

PUBLICATION_SAMPLE_CSV = """title,abstract,authors,school_code,publication_year,keywords,themes,doi
Deep Graph Neural Networks for Molecular Solubility Prediction,We present an attentive message-passing neural network for aqueous solubility estimation.,Dr. Maya Sharma; Dr. Vivek Murthy,SCSE,2024,"graph neural networks, cheminformatics, deep learning","Artificial Intelligence, Bioinformatics & Genomics",10.1016/j.molsci.2024.102
Precision Autonomous Irrigation Using LoRa Sensor Telemetry,Continuous soil impedance telemetry enables automated variable rate water delivery.,Dr. Maya Sharma,SEEE,2023,"iot, smart agriculture, lora","IoT & Smart Sensors, Precision Agriculture",10.1109/AGR.2023.402
"""

@router.get("/templates/{template_type}")
def download_sample_template(template_type: str):
    if template_type == "researchers":
        return Response(content=RESEARCHER_SAMPLE_CSV, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sample_researchers.csv"})
    elif template_type == "publications":
        return Response(content=PUBLICATION_SAMPLE_CSV, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=sample_publications.csv"})
    else:
        raise HTTPException(status_code=400, detail="Invalid template type. Use 'researchers' or 'publications'")

@router.post("/import/researchers/preview")
async def preview_researchers_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)

    required_cols = {"name", "email", "school_code"}
    if not reader.fieldnames or not required_cols.issubset(set(reader.fieldnames)):
        missing = required_cols - set(reader.fieldnames or [])
        raise HTTPException(status_code=400, detail=f"Missing required CSV columns: {', '.join(missing)}")

    # Validation checks
    validated_rows = []
    errors = []
    existing_emails = set(r[0] for r in db.query(Researcher.email).all())

    for idx, r in enumerate(rows, 1):
        row_errors = []
        name = r.get("name", "").strip()
        email = r.get("email", "").strip()
        school_code = r.get("school_code", "").strip()

        if not name:
            row_errors.append("Name is required")
        if not email or "@" not in email:
            row_errors.append("Invalid or missing email")
        if email in existing_emails:
            row_errors.append("Email already exists in database (Duplicate)")

        validated_rows.append({
            "row_index": idx,
            "name": name,
            "email": email,
            "school_code": school_code,
            "designation": r.get("designation", "Assistant Professor"),
            "research_interests": r.get("research_interests", ""),
            "is_valid": len(row_errors) == 0,
            "errors": row_errors
        })
        if row_errors:
            errors.extend([f"Row {idx}: {e}" for e in row_errors])

    return {
        "filename": file.filename,
        "total_rows": len(rows),
        "valid_rows_count": sum(1 for r in validated_rows if r["is_valid"]),
        "error_count": len(errors),
        "errors": errors[:10],
        "preview_data": validated_rows[:10]
    }

@router.post("/import/researchers/confirm")
async def confirm_researchers_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    text = content.decode("utf-8-sig", errors="ignore")
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)

    schools_map = {s.code: s.id for s in db.query(School).all()}
    existing_emails = set(r[0] for r in db.query(Researcher.email).all())

    imported_count = 0
    skipped_count = 0

    for r in rows:
        email = r.get("email", "").strip()
        name = r.get("name", "").strip()
        if not email or not name or email in existing_emails:
            skipped_count += 1
            continue

        school_id = schools_map.get(r.get("school_code", "").strip())
        interests = [x.strip() for x in r.get("research_interests", "").split(",") if x.strip()]
        skills = [x.strip() for x in r.get("skills", "").split(",") if x.strip()]

        new_r = Researcher(
            name=name,
            email=email,
            school_id=school_id,
            designation=r.get("designation", "Assistant Professor"),
            bio=r.get("bio", ""),
            research_interests=json.dumps(interests),
            skills=json.dumps(skills),
            keywords=json.dumps(interests + skills),
            h_index=int(r.get("h_index", 5)) if r.get("h_index") and r.get("h_index").isdigit() else 5,
            total_citations=int(r.get("total_citations", 100)) if r.get("total_citations") and r.get("total_citations").isdigit() else 100
        )
        db.add(new_r)
        existing_emails.add(email)
        imported_count += 1

    db.commit()
    return {
        "message": f"Import completed: {imported_count} imported, {skipped_count} skipped.",
        "imported": imported_count,
        "skipped": skipped_count
    }

@router.get("/export/researchers")
def export_researchers_csv(db: Session = Depends(get_db)):
    researchers = db.query(Researcher).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "email", "school", "designation", "h_index", "total_citations", "research_interests"])

    for r in researchers:
        interests = ", ".join(json.loads(r.research_interests)) if r.research_interests else ""
        school_name = r.school.name if r.school else "Unassigned"
        writer.writerow([r.id, r.name, r.email, school_name, r.designation, r.h_index, r.total_citations, interests])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=exported_researchers.csv"}
    )

@router.get("/export/publications")
def export_publications_csv(db: Session = Depends(get_db)):
    publications = db.query(Publication).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "title", "authors", "school", "year", "citations", "doi", "themes"])

    for p in publications:
        authors = "; ".join(json.loads(p.authors)) if p.authors else ""
        themes = ", ".join(json.loads(p.themes)) if p.themes else ""
        school_name = p.school.name if p.school else "Unassigned"
        writer.writerow([p.id, p.title, authors, school_name, p.publication_year, p.citation_count, p.doi, themes])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=exported_publications.csv"}
    )
