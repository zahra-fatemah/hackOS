from ortools.sat.python import cp_model

def optimize_seating(teams, tables):
    """
    teams: list of dicts [{'id': 'TeamA', 'size': 3, 'members': [...]}, ...]
    tables: list of dicts [{'id': 'Table1', 'capacity': 6}, ...]
    
    Returns:
    {
        'assignments': [
            {
                'table_id': 'Table1',
                'capacity': 6,
                'teams': ['TeamA'],
                'remaining': 3
            }
        ],
        'unseated': ['TeamB'],
        'wasted_seats': 3,
        'utilization_pct': 50.0,
        'generated_at': <ISO string> (handled by caller)
    }
    """
    model = cp_model.CpModel()
    
    num_teams = len(teams)
    num_tables = len(tables)
    
    # x[i][j] = 1 if team i is assigned to table j
    x = {}
    for i in range(num_teams):
        for j in range(num_tables):
            x[i, j] = model.NewBoolVar(f'x_{i}_{j}')
            
    # Each team can be assigned to at most one table
    for i in range(num_teams):
        model.Add(sum(x[i, j] for j in range(num_tables)) <= 1)
        
    # Table capacity constraints
    for j in range(num_tables):
        model.Add(sum(x[i, j] * teams[i]['size'] for i in range(num_teams)) <= tables[j]['capacity'])
        
    # Objective: Maximize total seated people
    total_seated = sum(
        x[i, j] * teams[i]['size'] 
        for i in range(num_teams) 
        for j in range(num_tables)
    )
    model.Maximize(total_seated)
    
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0 # timeout
    status = solver.Solve(model)
    
    assignments = []
    unseated = []
    
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        # We got a solution
        for j in range(num_tables):
            assigned_teams_for_table = []
            used_capacity = 0
            for i in range(num_teams):
                if solver.Value(x[i, j]) == 1:
                    assigned_teams_for_table.append(teams[i]['id'])
                    used_capacity += teams[i]['size']
                    
            assignments.append({
                'table_id': tables[j]['id'],
                'capacity': tables[j]['capacity'],
                'teams': assigned_teams_for_table,
                'remaining': tables[j]['capacity'] - used_capacity
            })
            
        for i in range(num_teams):
            is_assigned = False
            for j in range(num_tables):
                if solver.Value(x[i, j]) == 1:
                    is_assigned = True
                    break
            if not is_assigned:
                unseated.append(teams[i]['id'])
    else:
        # Fallback if no solution at all (should not happen with this formulation, but just in case)
        for j in range(num_tables):
            assignments.append({
                'table_id': tables[j]['id'],
                'capacity': tables[j]['capacity'],
                'teams': [],
                'remaining': tables[j]['capacity']
            })
        unseated = [t['id'] for t in teams]
        
    # Stats
    total_capacity = sum(t['capacity'] for t in tables)
    used_seats = total_capacity - sum(a['remaining'] for a in assignments)
    
    wasted_seats = sum(a['remaining'] for a in assignments if len(a['teams']) > 0)
    # Total empty seats on used tables
    
    util_pct = (used_seats / total_capacity * 100) if total_capacity > 0 else 0
    
    return {
        'assignments': assignments,
        'unseated': unseated,
        'wasted_seats': wasted_seats,
        'utilization_pct': round(util_pct, 2)
    }
