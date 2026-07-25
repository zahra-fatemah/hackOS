import io
import openpyxl
from typing import List, Dict, Any

def generate_seating_excel(assignments: List[Dict[str, Any]]) -> io.BytesIO:
    """
    Generates an Excel file from seating assignments.
    Columns: Participant Name, Registration ID, Team ID, Table, Seat, Judge, Hall
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Seating Assignments"
    
    # Headers
    headers = [
        "Participant ID", 
        "Registration ID", 
        "Team ID", 
        "Table Number", 
        "Seat Number", 
        "Row", 
        "Column",
        "Judge ID", 
    ]
    ws.append(headers)
    
    # Data
    for a in assignments:
        row = [
            a.get("participant_id", ""),
            a.get("registration_id", ""),
            a.get("team_id", ""),
            a.get("table_number", ""),
            a.get("seat_number", ""),
            a.get("row", ""),
            a.get("column", ""),
            a.get("judge_id", "")
        ]
        ws.append(row)
        
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return output
