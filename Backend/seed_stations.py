import os
from db import get_connection

def seed_stations():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(root_dir, "data")
    station_file = os.path.join(data_dir, "station.txt")
    color_file = os.path.join(data_dir, "colorcodes.txt")

    if not os.path.exists(station_file) or not os.path.exists(color_file):
        print("Data files not found.")
        return

    with open(station_file, 'r') as f_s, open(color_file, 'r') as f_c:
        stations = f_s.read().splitlines()
        colors = f_c.read().splitlines()

    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT COUNT(*) FROM Station")
        if cursor.fetchone()[0] > 0:
            print("Stations already seeded.")
            return

        print(f"Seeding {len(stations)} stations...")
        for i in range(len(stations)):
            name = stations[i].strip()
            color = colors[i].strip() if i < len(colors) else "Grey"
            
            # Using INSERT IGNORE or standard insert
            # Assuming Station_id is AUTO_INCREMENT, but we can force ID if needed.
            # Local route_manager maps Station_id to index 0..247
            # So let's insert them strictly by ID (1-indexed for DB typically, but let's just insert in order)
            cursor.execute(
                "INSERT INTO Station (Station_name, Line_color, Coordinates) VALUES (%s, %s, ST_GeomFromText('POINT(0 0)'))",
                (name, color)
            )

        conn.commit()
        print("Successfully seeded stations!")
    except Exception as e:
        conn.rollback()
        print(f"Error seeding stations: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    seed_stations()
