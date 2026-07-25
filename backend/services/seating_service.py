from datetime import datetime, timezone
import uuid
from typing import List, Dict, Any

def generate_smart_seating(
    participants: List[Dict[str, Any]],
    hackathon_id: str,
    hall_name: str,
    rows: int,
    columns: int,
    tables_count: int,
    seats_per_table: int,
    generated_by: str
) -> dict:
    """
    Generates smart seating assignment based on Feature 4 requirements:
    - Group by team
    - Sort teams by size (largest first) and group by judge
    - Never split teams
    - Assign to tables row by row
    """
    # 1. Group by Team
    teams_map = {}
    
    for p in participants:
        # Fallbacks if fields don't exist
        team_id = p.get("team_id")
        if not team_id:
            team_id = f"INDIVIDUAL_{p.get('_id', uuid.uuid4().hex)}"
            
        if team_id not in teams_map:
            teams_map[team_id] = {
                "team_id": team_id,
                "judge_id": p.get("assigned_judge_id", p.get("judge_id", "")),
                "members": []
            }
        teams_map[team_id]["members"].append(p)
    
    teams = list(teams_map.values())
    
    # 2. Sort teams:
    # First by judge_id to minimize walking distance (same judge gets adjacent tables)
    # Then by size descending (largest teams first)
    teams.sort(key=lambda t: (t["judge_id"] or "", -len(t["members"])))
    
    # 3. Create Tables
    total_capacity = tables_count * seats_per_table
    if len(participants) > total_capacity:
        raise ValueError(f"Capacity ({total_capacity}) is less than registered participants ({len(participants)}).")
        
    tables = []
    for i in range(tables_count):
        r = (i // columns) + 1
        c = (i % columns) + 1
        tables.append({
            "table_number": f"T{i+1:02d}",
            "row": r,
            "column": c,
            "capacity": seats_per_table,
            "assigned_members": [],
            "judge_ids": set()
        })
        
    assignments = []
    
    # 4. Assign complete teams
    for team in teams:
        members = team["members"]
        team_size = len(members)
        judge_id = team["judge_id"]
        
        # Find first table that can fit the whole team
        assigned = False
        for table in tables:
            if (table["capacity"] - len(table["assigned_members"])) >= team_size:
                # Assign to this table
                for idx, p in enumerate(members):
                    seat_idx = len(table["assigned_members"]) + 1
                    assignment = {
                        "hackathon_id": hackathon_id,
                        "participant_id": p.get("participant_id") or p.get("id") or str(p.get("_id", "")),
                        "registration_id": p.get("registration_id", ""),
                        "team_id": team["team_id"] if not team["team_id"].startswith("INDIVIDUAL") else "",
                        "table_number": table["table_number"],
                        "seat_number": f"S{seat_idx:02d}",
                        "row": table["row"],
                        "column": table["column"],
                        "judge_id": judge_id,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    table["assigned_members"].append(assignment)
                    assignments.append(assignment)
                
                if judge_id:
                    table["judge_ids"].add(judge_id)
                assigned = True
                break
                
        if not assigned:
            # If a team is bigger than a single table, or no single table has enough space,
            # the strict requirement "Never split teams" fails. 
            raise ValueError(f"Cannot fit team {team['team_id']} of size {team_size} at any single table without splitting.")

    # Generate layout object
    now = datetime.now(timezone.utc).isoformat()
    
    layout = {
        "hackathon_id": hackathon_id,
        "generated_at": now,
        "generated_by": generated_by,
        "hall_name": hall_name,
        "rows": rows,
        "columns": columns,
        "tables": tables_count,
        "total_capacity": total_capacity,
        "occupied_seats": len(assignments),
        "available_seats": total_capacity - len(assignments)
    }
    
    return layout, assignments
