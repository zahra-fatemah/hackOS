import app
from flask import Flask

with app.app.test_request_context('/api/organizer/dashboard-stats?organizer_email=amd90982@gmail.com'):
    app.get_dashboard_stats()
    print("Success")
