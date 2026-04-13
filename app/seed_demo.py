import uuid
import random
from datetime import datetime, timedelta
from app.database import SessionLocal, init_db
from app.models import (
    User,
    Script,
    ActivityLog,
    Milestone,
    Notification,
    Report,
    ReportSchedule,
    DailySuggestion,
    LibraryResource,
    Activity,
)


def create_users_with_data():
    """Create 2 users with weeks of activity data."""
    db = SessionLocal()
    try:
        # First seed the base data if not exists
        seed_base_data(db)

        # Delete existing demo users if they exist
        db.query(ActivityLog).filter(
            ActivityLog.user_id.in_(
                db.query(User.phone).filter(
                    User.phone.in_(["5550000001", "5550000002"])
                )
            )
        ).delete(synchronize_session=False)

        db.query(Script).filter(
            Script.user_id.in_(
                db.query(User.id).filter(User.phone.in_(["5550000001", "5550000002"]))
            )
        ).delete(synchronize_session=False)

        db.query(Milestone).filter(
            Milestone.user_id.in_(
                db.query(User.id).filter(User.phone.in_(["5550000001", "5550000002"]))
            )
        ).delete(synchronize_session=False)

        db.query(Notification).filter(
            Notification.user_id.in_(
                db.query(User.id).filter(User.phone.in_(["5550000001", "5550000002"]))
            )
        ).delete(synchronize_session=False)

        db.query(Report).filter(
            Report.user_id.in_(
                db.query(User.id).filter(User.phone.in_(["5550000001", "5550000002"]))
            )
        ).delete(synchronize_session=False)

        db.query(ReportSchedule).filter(
            ReportSchedule.user_id.in_(
                db.query(User.id).filter(User.phone.in_(["5550000001", "5550000002"]))
            )
        ).delete(synchronize_session=False)

        db.query(User).filter(User.phone.in_(["5550000001", "5550000002"])).delete(
            synchronize_session=False
        )
        db.commit()

        print("Cleaned up existing demo users")

        # Create two users
        users_data = [
            {
                "name": "Sarah Johnson",
                "email": "sarah.johnson@email.com",
                "phone": "5550000001",
                "country_code": "+1",
                "child_name": "Emma",
                "child_age": 5,
            },
            {
                "name": "Michael Chen",
                "email": "michael.chen@email.com",
                "phone": "5550000002",
                "country_code": "+1",
                "child_name": "Alex",
                "child_age": 4,
            },
        ]

        users = []
        for ud in users_data:
            user = User(
                id=str(uuid.uuid4()),
                name=ud["name"],
                email=ud["email"],
                phone=ud["phone"],
                country_code=ud["country_code"],
                is_verified=True,
                is_active=True,
                child_name=ud["child_name"],
                child_age=ud["child_age"],
                created_at=datetime.utcnow() - timedelta(weeks=4),
            )
            db.add(user)
            users.append(user)
        db.commit()

        print(f"Created {len(users)} users")

        # Create scripts for each user (spread over 4 weeks)
        contexts = ["home", "school", "car", "bedtime"]
        emotional_states = ["happy", "excited", "neutral", "sad", "anxious", "angry"]
        sources = ["school", "tv", "song", "parent", "unknown"]
        frequencies = ["new", "daily", "weekly", "variation"]

        script_templates = [
            ("I want more", "happy", "home", "daily"),
            ("Can I have that?", "neutral", "school", "weekly"),
            ("Please help me", "anxious", "home", "daily"),
            ("Thank you", "happy", "home", "daily"),
            ("I don't like that", "sad", "car", "weekly"),
            ("Let's play", "excited", "home", "daily"),
            ("It's mine", "angry", "school", "variation"),
            ("I need a break", "anxious", "bedtime", "weekly"),
            ("Good morning", "happy", "home", "daily"),
            ("Time to go", "neutral", "car", "daily"),
            ("I feel happy", "happy", "home", "daily"),
            ("Can I have water?", "neutral", "home", "daily"),
            ("That's scary", "anxious", "bedtime", "variation"),
            ("I want to go outside", "excited", "home", "daily"),
            ("Good job!", "happy", "school", "weekly"),
        ]

        for user in users:
            scripts_created = 0
            # Create scripts over 4 weeks (roughly 3-4 scripts per week = ~15 total)
            for week in range(4):
                # 3-5 scripts per week
                num_scripts = random.randint(3, 5)
                for i in range(num_scripts):
                    template = random.choice(script_templates)
                    # Random day within the week
                    days_ago = random.randint(0, 6)
                    created_at = datetime.utcnow() - timedelta(
                        weeks=3 - week, days=days_ago
                    )

                    script = Script(
                        id=str(uuid.uuid4()),
                        user_id=user.id,
                        script_text=template[0],
                        context=template[2],
                        emotional_state=template[1],
                        source=random.choice(sources),
                        frequency=template[3],
                        meaning=f"Meaning: {template[0]}",
                        notes=f"Practice at {template[2]}",
                        created_at=created_at,
                        updated_at=created_at
                        + timedelta(minutes=random.randint(1, 30)),
                    )
                    db.add(script)
                    scripts_created += 1

            db.commit()
            print(f"Created {scripts_created} scripts for {user.name}")

            # Create activity logs for each user
            activities = db.query(Activity).limit(10).all()
            activity_statuses = ["completed", "in_progress", "not_started"]

            logs_created = 0
            for week in range(4):
                num_logs = random.randint(3, 6)
                for i in range(num_logs):
                    activity = random.choice(activities)
                    days_ago = random.randint(0, 6)
                    started_at = datetime.utcnow() - timedelta(
                        weeks=3 - week, days=days_ago
                    )
                    status = random.choice(activity_statuses)

                    log = ActivityLog(
                        id=str(uuid.uuid4()),
                        user_id=user.id,
                        activity_id=activity.id,
                        status=status,
                        started_at=started_at,
                        completed_at=started_at
                        + timedelta(minutes=random.randint(10, 30))
                        if status == "completed"
                        else None,
                    )
                    db.add(log)
                    logs_created += 1

            db.commit()
            print(f"Created {logs_created} activity logs for {user.name}")

            # Create milestones for each user
            milestone_titles = [
                ("Said first word", "celebrate"),
                ("Used 'please' correctly", "star"),
                ("Completed daily routine", "trophy"),
                ("Named 5 colors", "star"),
                ("Asked for help independently", "celebrate"),
                ("Played with peer for 10 min", "trophy"),
                ("Followed 2-step instruction", "star"),
                ("Identified own emotions", "celebrate"),
            ]

            milestones_created = 0
            for i, (title, icon) in enumerate(milestone_titles):
                achieved_at = datetime.utcnow() - timedelta(
                    weeks=3 - i // 2, days=random.randint(0, 6)
                )

                milestone = Milestone(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    title=title,
                    icon=icon,
                    achieved_on=achieved_at.date(),
                )
                db.add(milestone)
                milestones_created += 1

            db.commit()
            print(f"Created {milestones_created} milestones for {user.name}")

            # Create notifications for each user
            notification_templates = [
                ("Script Update", "New script added to your collection", "script"),
                ("Weekly Report", "Your weekly progress report is ready", "report"),
                (
                    "Milestone Achieved",
                    f"{user.child_name} achieved a new milestone!",
                    "milestone",
                ),
                ("Daily Reminder", "Time to practice your scripts", "reminder"),
                ("Activity Suggestion", "Try this new activity today", "activity"),
                (
                    "Progress Update",
                    f"{user.child_name}'s progress this week",
                    "progress",
                ),
            ]

            notifications_created = 0
            for week in range(4):
                num_notifs = random.randint(2, 4)
                for i in range(num_notifs):
                    template = random.choice(notification_templates)
                    days_ago = random.randint(0, 6)
                    created_at = datetime.utcnow() - timedelta(
                        weeks=3 - week, days=days_ago
                    )

                    notification = Notification(
                        id=str(uuid.uuid4()),
                        user_id=user.id,
                        type=template[2],
                        title=template[0],
                        message=template[1],
                        read=random.choice([True, False]),
                        created_at=created_at,
                    )
                    db.add(notification)
                    notifications_created += 1

            db.commit()
            print(f"Created {notifications_created} notifications for {user.name}")

            # Create reports for each user
            report_titles = [
                "Weekly Progress Report",
                "Monthly Development Summary",
                "Weekly Progress Report",
                "Monthly Development Summary",
            ]
            periods = ["week", "month", "week", "month"]

            reports_created = 0
            for i, (title, period) in enumerate(zip(report_titles, periods)):
                created_at = datetime.utcnow() - timedelta(weeks=3 - i)

                # Calculate dates based on period
                if period == "week":
                    start_date = created_at - timedelta(days=7)
                    end_date = created_at
                else:
                    start_date = created_at - timedelta(days=30)
                    end_date = created_at

                report = Report(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    title=title,
                    period_type=period,
                    start_date=start_date.date(),
                    end_date=end_date.date(),
                    total_scripts=random.randint(15, 30),
                    positive_pct=random.randint(60, 85),
                    growth_rate=random.randint(5, 20),
                    new_milestones=random.randint(1, 3),
                    generated_at=created_at,
                )
                db.add(report)
                reports_created += 1

            db.commit()
            print(f"Created {reports_created} reports for {user.name}")

            # Create report schedules for each user
            schedule = ReportSchedule(
                id=str(uuid.uuid4()),
                user_id=user.id,
                frequency="weekly",
                email=user.email,
                active=True,
                created_at=datetime.utcnow() - timedelta(weeks=3),
            )
            db.add(schedule)
            db.commit()
            print(f"Created report schedule for {user.name}")

        print("\n=== Seed Data Complete ===")
        print(f"Total Users: {len(users)}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


def seed_base_data(db):
    """Seed base data (daily suggestions, library resources, activities)."""

    # Check if already seeded
    if db.query(DailySuggestion).first():
        print("Base data already exists, skipping...")
        return

    # Daily Suggestions
    suggestions = [
        {
            "text": "Try this today: 'Let's play together.'",
            "activity_name": "Let's play together",
            "icon_url": "https://cdn.example.com/play.png",
            "active": True,
        },
        {
            "text": "Practice these words: 'I want more'",
            "activity_name": "Requesting More",
            "icon_url": "https://cdn.example.com/more.png",
            "active": True,
        },
        {
            "text": "Today let's practice greetings!",
            "activity_name": "Greeting Practice",
            "icon_url": "https://cdn.example.com/hi.png",
            "active": True,
        },
        {
            "text": "Try using 'please' today",
            "activity_name": "Using Please",
            "icon_url": "https://cdn.example.com/please.png",
            "active": True,
        },
        {
            "text": "Practice pointing to what you want",
            "activity_name": "Pointing Practice",
            "icon_url": "https://cdn.example.com/point.png",
            "active": True,
        },
        {
            "text": "Let's practice saying 'no' politely",
            "activity_name": "Polite No",
            "icon_url": "https://cdn.example.com/no.png",
            "active": True,
        },
        {
            "text": "Practice saying 'thank you' today",
            "activity_name": "Saying Thanks",
            "icon_url": "https://cdn.example.com/thanks.png",
            "active": True,
        },
        {
            "text": "Try using words to ask for help",
            "activity_name": "Asking Help",
            "icon_url": "https://cdn.example.com/help.png",
            "active": True,
        },
    ]
    for s in suggestions:
        db.add(DailySuggestion(id=str(uuid.uuid4()), **s))
    print(f"Seeded {len(suggestions)} daily suggestions")

    # Library Resources
    categories = ["emotions", "routines", "social", "communication"]
    age_groups = ["2-3 years", "3-4 years", "4-6 years", "All Ages"]

    emotions_data = [
        ("Identifying Happy", "I feel happy when..."),
        ("Identifying Sad", "I feel sad when..."),
        ("Identifying Angry", "I feel angry when..."),
        ("Calm Down Steps", "When I feel upset I can..."),
        ("Using Words for Feelings", "I can say 'I feel...'"),
    ]
    routines_data = [
        ("Morning Routine", "Time to start our day!"),
        ("Bedtime Routine", "Time to sleep!"),
        ("Bath Time Routine", "Time to get clean!"),
        ("Meal Time Routine", "Time to eat!"),
        ("Going Out Routine", "Time to go outside!"),
    ]
    social_data = [
        ("Taking Turns", "We take turns playing"),
        ("Sharing Toys", "Let's share our toys"),
        ("Playing with Friends", "Playing together is fun!"),
        ("Saying Hello", "Hi friend!"),
        ("Goodbye Waves", "Bye bye!"),
    ]
    comm_data = [
        ("Requesting Items", "I want..."),
        ("Asking for Help", "Please help me"),
        ("Saying Yes", "Yes, please!"),
        ("Saying No", "No, thank you"),
        ("Naming Objects", "This is a..."),
    ]

    all_resources = [
        (emotions_data, "emotions"),
        (routines_data, "routines"),
        (social_data, "social"),
        (comm_data, "communication"),
    ]

    resources_count = 0
    for data, category in all_resources:
        for title, desc in data:
            for age in age_groups:
                db.add(
                    LibraryResource(
                        id=str(uuid.uuid4()),
                        title=title,
                        description=desc,
                        category=category,
                        age_group=age,
                        avatar_url=f"https://cdn.example.com/{category}/{title.lower().replace(' ', '-')}.png",
                    )
                )
                resources_count += 1
    print(f"Seeded {resources_count} library resources")

    # Activities
    activities_data = [
        (
            "Bird Nest Rescue",
            "Help the mama bird find her lost eggs",
            "3-6 yrs",
            "Stage 1-2",
            "15-20 min",
            "motor_skills",
        ),
        (
            "Rainbow Sorting",
            "Sort colored objects into matching bins",
            "2-4 yrs",
            "Stage 1",
            "10-15 min",
            "cognitive",
        ),
        (
            "Moonlit Forest",
            "Explore a calming nighttime forest",
            "4-6 yrs",
            "Stage 2",
            "20-30 min",
            "sensory",
        ),
        (
            "Garden Play",
            "Plant seeds and watch them grow",
            "6+ yrs",
            "Stage 3+",
            "25-30 min",
            "social",
        ),
        (
            "Animal Sounds",
            "Learn sounds different animals make",
            "2-4 yrs",
            "Stage 1",
            "10 min",
            "cognitive",
        ),
        (
            "Shape Puzzles",
            "Match shapes to their holes",
            "2-4 yrs",
            "Stage 1",
            "10-15 min",
            "cognitive",
        ),
        (
            "Bubble Pop",
            "Pop bubbles to practice fine motor",
            "2-4 yrs",
            "Stage 1",
            "5-10 min",
            "motor_skills",
        ),
        (
            "Sensory Ball",
            "Feel different textures on balls",
            "3-6 yrs",
            "Stage 1-2",
            "10 min",
            "sensory",
        ),
        (
            "Music Movement",
            "Dance to different types of music",
            "3-6 yrs",
            "Stage 1-2",
            "15 min",
            "motor_skills",
        ),
        (
            "Face Match",
            "Match eyes, nose, mouth to faces",
            "3-4 yrs",
            "Stage 1",
            "10 min",
            "cognitive",
        ),
    ]

    more_activities = [
        (
            "Token Economy",
            "Earn tokens for good behavior",
            "4-6 yrs",
            "Stage 2",
            "20 min",
            "social",
        ),
        (
            "Visual Schedule",
            "Follow picture schedules",
            "3-6 yrs",
            "Stage 1-2",
            "15 min",
            "cognitive",
        ),
        (
            "Social Stories",
            "Read stories about social situations",
            "4-6 yrs",
            "Stage 2",
            "15 min",
            "social",
        ),
        (
            "Breathing Exercises",
            "Practice calm breathing",
            "4-6 yrs",
            "Stage 2",
            "5 min",
            "sensory",
        ),
        (
            "Simple Cooking",
            "Help make simple snacks",
            "6+ yrs",
            "Stage 3+",
            "30 min",
            "cognitive",
        ),
        (
            "Picture Communication",
            "Use pictures to communicate",
            "2-4 yrs",
            "Stage 1",
            "15 min",
            "communication",
        ),
        (
            "Color Hunt",
            "Find items of specific colors",
            "2-4 yrs",
            "Stage 1",
            "10 min",
            "cognitive",
        ),
        (
            "Sand Play",
            "Feel and play with sand",
            "3-6 yrs",
            "Stage 1-2",
            "15 min",
            "sensory",
        ),
        (
            "Ball Toss",
            "Throw and catch a soft ball",
            "3-6 yrs",
            "Stage 1-2",
            "10 min",
            "motor_skills",
        ),
        (
            "Mirror Play",
            "Make faces in mirror",
            "2-4 yrs",
            "Stage 1",
            "5 min",
            "social",
        ),
    ]

    for a in activities_data + more_activities:
        db.add(
            Activity(
                id=str(uuid.uuid4()),
                title=a[0],
                description=a[1],
                image_url=f"https://cdn.example.com/{a[0].lower().replace(' ', '-')}.png",
                age_range=a[2],
                stage=a[3],
                play_duration=a[4],
                category=a[5],
            )
        )
    print(f"Seeded {len(activities_data) + len(more_activities)} activities")

    db.commit()


if __name__ == "__main__":
    init_db()
    print("Database initialized")
    create_users_with_data()
