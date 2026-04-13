import uuid
from datetime import datetime
from app.database import SessionLocal, engine, init_db
from app.models import DailySuggestion, LibraryResource, Activity


def seed_daily_suggestions():
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
    db = SessionLocal()
    try:
        for s in suggestions:
            existing = (
                db.query(DailySuggestion)
                .filter(DailySuggestion.activity_name == s["activity_name"])
                .first()
            )
            if not existing:
                suggestion = DailySuggestion(id=str(uuid.uuid4()), **s)
                db.add(suggestion)
        db.commit()
        print(f"Seeded {len(suggestions)} daily suggestions")
    finally:
        db.close()


def seed_library_resources():
    resources = []
    categories = ["emotions", "routines", "social", "communication"]
    age_groups = ["2-3 years", "3-4 years", "4-6 years", "All Ages"]

    emotions_data = [
        ("Identifying Happy", "I feel happy when..."),
        ("Identifying Sad", "I feel sad when..."),
        ("Identifying Angry", "I feel angry when..."),
        ("Calm Down Steps", "When I feel upset I can..."),
        ("Using Words for Feelings", "I can say 'I feel...'"),
    ]
    for title, desc in emotions_data:
        for age in age_groups:
            resources.append(
                {
                    "title": title,
                    "description": desc,
                    "category": "emotions",
                    "age_group": age,
                    "avatar_url": f"https://cdn.example.com/emotions/{title.lower().replace(' ', '-')}.png",
                }
            )

    routines_data = [
        ("Morning Routine", "Time to start our day!"),
        ("Bedtime Routine", "Time to sleep!"),
        ("Bath Time Routine", "Time to get clean!"),
        ("Meal Time Routine", "Time to eat!"),
        ("Going Out Routine", "Time to go outside!"),
    ]
    for title, desc in routines_data:
        for age in age_groups:
            resources.append(
                {
                    "title": title,
                    "description": desc,
                    "category": "routines",
                    "age_group": age,
                    "avatar_url": f"https://cdn.example.com/routines/{title.lower().replace(' ', '-')}.png",
                }
            )

    social_data = [
        ("Taking Turns", "We take turns playing"),
        ("Sharing Toys", "Let's share our toys"),
        ("Playing with Friends", "Playing together is fun!"),
        ("Saying Hello", "Hi friend!"),
        ("Goodbye Waves", "Bye bye!"),
    ]
    for title, desc in social_data:
        for age in age_groups:
            resources.append(
                {
                    "title": title,
                    "description": desc,
                    "category": "social",
                    "age_group": age,
                    "avatar_url": f"https://cdn.example.com/social/{title.lower().replace(' ', '-')}.png",
                }
            )

    comm_data = [
        ("Requesting Items", "I want..."),
        ("Asking for Help", "Please help me"),
        ("Saying Yes", "Yes, please!"),
        ("Saying No", "No, thank you"),
        ("Naming Objects", "This is a..."),
    ]
    for title, desc in comm_data:
        for age in age_groups:
            resources.append(
                {
                    "title": title,
                    "description": desc,
                    "category": "communication",
                    "age_group": age,
                    "avatar_url": f"https://cdn.example.com/comm/{title.lower().replace(' ', '-')}.png",
                }
            )

    db = SessionLocal()
    try:
        count = 0
        for r in resources:
            existing = (
                db.query(LibraryResource)
                .filter(
                    LibraryResource.title == r["title"],
                    LibraryResource.age_group == r["age_group"],
                )
                .first()
            )
            if not existing:
                resource = LibraryResource(id=str(uuid.uuid4()), **r)
                db.add(resource)
                count += 1
        db.commit()
        print(f"Seeded {count} library resources")
    finally:
        db.close()


def seed_activities():
    activities = [
        {
            "title": "Bird Nest Rescue",
            "description": "Help the mama bird find her lost eggs",
            "image_url": "https://cdn.example.com/bird.png",
            "age_range": "3-6 yrs",
            "stage": "Stage 1-2",
            "play_duration": "15-20 min",
            "category": "motor_skills",
        },
        {
            "title": "Rainbow Sorting",
            "description": "Sort colored objects into matching bins",
            "image_url": "https://cdn.example.com/rainbow.png",
            "age_range": "2-4 yrs",
            "stage": "Stage 1",
            "play_duration": "10-15 min",
            "category": "cognitive",
        },
        {
            "title": "Moonlit Forest",
            "description": "Explore a calming nighttime forest",
            "image_url": "https://cdn.example.com/forest.png",
            "age_range": "4-6 yrs",
            "stage": "Stage 2",
            "play_duration": "20-30 min",
            "category": "sensory",
        },
        {
            "title": "Garden Play",
            "description": "Plant seeds and watch them grow",
            "image_url": "https://cdn.example.com/garden.png",
            "age_range": "6+ yrs",
            "stage": "Stage 3+",
            "play_duration": "25-30 min",
            "category": "social",
        },
        {
            "title": "Animal Sounds",
            "description": "Learn sounds different animals make",
            "image_url": "https://cdn.example.com/animals.png",
            "age_range": "2-4 yrs",
            "stage": "Stage 1",
            "play_duration": "10 min",
            "category": "cognitive",
        },
        {
            "title": "Shape Puzzles",
            "description": "Match shapes to their holes",
            "image_url": "https://cdn.example.com/shapes.png",
            "age_range": "2-4 yrs",
            "stage": "Stage 1",
            "play_duration": "10-15 min",
            "category": "cognitive",
        },
        {
            "title": "Bubble Pop",
            "description": "Pop bubbles to practice fine motor",
            "image_url": "https://cdn.example.com/bubbles.png",
            "age_range": "2-4 yrs",
            "stage": "Stage 1",
            "play_duration": "5-10 min",
            "category": "motor_skills",
        },
        {
            "title": "Sensory Ball",
            "description": "Feel different textures on balls",
            "image_url": "https://cdn.example.com/ball.png",
            "age_range": "3-6 yrs",
            "stage": "Stage 1-2",
            "play_duration": "10 min",
            "category": "sensory",
        },
        {
            "title": "Music Movement",
            "description": "Dance to different types of music",
            "image_url": "https://cdn.example.com/music.png",
            "age_range": "3-6 yrs",
            "stage": "Stage 1-2",
            "play_duration": "15 min",
            "category": "motor_skills",
        },
        {
            "title": "Face Match",
            "description": "Match eyes, nose, mouth to faces",
            "image_url": "https://cdn.example.com/face.png",
            "age_range": "3-4 yrs",
            "stage": "Stage 1",
            "play_duration": "10 min",
            "category": "cognitive",
        },
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
        (
            "Puzzle Blocks",
            "Stack blocks to make patterns",
            "2-4 yrs",
            "Stage 1",
            "15 min",
            "cognitive",
        ),
        (
            "Water Play",
            "Pour and splash water",
            "2-4 yrs",
            "Stage 1",
            "15 min",
            "sensory",
        ),
        (
            "Animal Matching",
            "Match animal pictures",
            "3-4 yrs",
            "Stage 1",
            "10 min",
            "cognitive",
        ),
        (
            "Feelings Cards",
            "Identify feelings on cards",
            "4-6 yrs",
            "Stage 2",
            "10 min",
            "emotions",
        ),
        (
            "Clothespins",
            "Pinch clothespins onto fabric",
            "4-6 yrs",
            "Stage 2",
            "10 min",
            "motor_skills",
        ),
        (
            "Playdough",
            "Squash and shape playdough",
            "3-6 yrs",
            "Stage 1-2",
            "15 min",
            "motor_skills",
        ),
        (
            "Sound Hunt",
            "Find things that make sounds",
            "2-4 yrs",
            "Stage 1",
            "10 min",
            "cognitive",
        ),
        (
            "Simple Baking",
            "Mix ingredients for simple bake",
            "6+ yrs",
            "Stage 3+",
            "45 min",
            "cognitive",
        ),
        "Painting",
        "Paint pictures with brushes",
        "3-6 yrs",
        "Stage 1-2",
        "20 min",
        "motor_skills",
        "Clay Play",
        "Shape clay into objects",
        "4-6 yrs",
        "Stage 2",
        "20 min",
        "motor_skills",
    ]
    for a in more_activities:
        if isinstance(a, tuple):
            activities.append(
                {
                    "title": a[0],
                    "description": a[1],
                    "image_url": f"https://cdn.example.com/{a[0].lower().replace(' ', '-')}.png",
                    "age_range": a[2],
                    "stage": a[3],
                    "play_duration": a[4],
                    "category": a[5],
                }
            )
        else:
            activities.append(
                {
                    "title": a,
                    "description": f"Activity: {a}",
                    "image_url": f"https://cdn.example.com/{a.lower().replace(' ', '-')}.png",
                    "age_range": "3-6 yrs",
                    "stage": "Stage 1-2",
                    "play_duration": "15 min",
                    "category": "cognitive",
                }
            )

    while len(activities) < 35:
        i = len(activities) + 1
        activities.append(
            {
                "title": f"Activity {i}",
                "description": f"Fun activity number {i}",
                "image_url": f"https://cdn.example.com/activity{i}.png",
                "age_range": "3-6 yrs",
                "stage": "Stage 1-2",
                "play_duration": "15 min",
                "category": "cognitive",
            }
        )

    db = SessionLocal()
    try:
        count = 0
        for a in activities:
            existing = db.query(Activity).filter(Activity.title == a["title"]).first()
            if not existing:
                act = Activity(id=str(uuid.uuid4()), **a)
                db.add(act)
                count += 1
        db.commit()
        print(f"Seeded {count} activities")
    finally:
        db.close()


def seed_all():
    init_db()
    print("Database initialized")
    seed_daily_suggestions()
    seed_library_resources()
    seed_activities()
    print("All seed data complete!")


if __name__ == "__main__":
    seed_all()
