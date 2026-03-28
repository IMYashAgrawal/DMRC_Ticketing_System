import os
import math

class RouteManager:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.V = 248
        self.stations = {}  # ID -> dict of name, color, arrival times
        self.graph = {}     # src_id -> {dest_id: distance}
        self.load_data()

    def load_data(self):
        # Initialize graph
        for i in range(self.V):
            self.stations[i] = {"name": "", "color": "", "arrival_times": []}
            self.graph[i] = {}

        # 1. Load Node/Edges (from node_values_new.txt)
        node_file = os.path.join(self.data_dir, "node_values_new.txt")
        try:
            with open(node_file, 'r') as f:
                content = f.read().split()
                idx = 0
                while idx < len(content):
                    temp = int(content[idx])
                    idx += 1
                    n1 = int(content[idx])
                    idx += 1
                    for _ in range(temp):
                        n2 = int(content[idx])
                        idx += 1
                        dis = float(content[idx])
                        idx += 1
                        if n1 > 0 and n2 > 0 and n1 <= self.V and n2 <= self.V:
                            self.graph[n1 - 1][n2 - 1] = dis
                            self.graph[n2 - 1][n1 - 1] = dis
        except Exception as e:
            print(f"Error loading nodes: {e}")

        # 2. Load Station Names and Colors
        station_file = os.path.join(self.data_dir, "station.txt")
        color_file = os.path.join(self.data_dir, "colorcodes.txt")
        try:
            with open(station_file, 'r') as f_s, open(color_file, 'r') as f_c:
                s_lines = f_s.read().splitlines()
                c_lines = f_c.read().splitlines()
                for i in range(min(self.V, len(s_lines), len(c_lines))):
                    self.stations[i]["name"] = s_lines[i]
                    self.stations[i]["color"] = c_lines[i]
        except Exception as e:
            print(f"Error loading stations/colors: {e}")

        # 3. Load Arrival Times
        time_file = os.path.join(self.data_dir, "arrival_times.txt")
        try:
            with open(time_file, 'r') as f:
                lines = f.read().splitlines()
                for i in range(min(self.V, len(lines))):
                    self.stations[i]["arrival_times"] = lines[i].split(",")
        except Exception as e:
            print(f"Error loading arrival times: {e}")

    def _lcs(self, X, Y):
        X, Y = X.lower(), Y.lower()
        m, n = len(X), len(Y)
        L = [[0]*(n+1) for _ in range(m+1)]
        for i in range(1, m+1):
            for j in range(1, n+1):
                if X[i-1] == Y[j-1]:
                    L[i][j] = L[i-1][j-1] + 1
                else:
                    L[i][j] = max(L[i-1][j], L[i][j-1])
        return L[m][n]

    def _same_match(self, s):
        max_val = 0
        max_i = -1
        for i in range(self.V):
            if not self.stations[i]["name"]:
                continue
            val = self._lcs(s, self.stations[i]["name"])
            if val > max_val:
                max_val = val
                max_i = i
        if max_i == -1 or max_val < len(self.stations[max_i]["name"]) / 2.0:
            return -1
        return max_i

    def dijkstra(self, src_id, target_id):
        dist = [float('inf')] * self.V
        parent = [-1] * self.V
        sptSet = [False] * self.V
        dist[src_id] = 0

        for _ in range(self.V - 1):
            u = -1
            min_dist = float('inf')
            for v in range(self.V):
                if not sptSet[v] and dist[v] <= min_dist:
                    min_dist = dist[v]
                    u = v

            if u == -1 or dist[u] == float('inf'):
                break
            sptSet[u] = True

            for v, weight in self.graph[u].items():
                if not sptSet[v] and dist[u] + weight < dist[v]:
                    dist[v] = dist[u] + weight
                    parent[v] = u

        path = []
        curr = target_id
        while curr != -1:
            path.append(curr)
            curr = parent[curr]
        path.reverse()

        return dist[target_id], path

    def get_route(self, source_name, dest_name):
        src_id = self._same_match(source_name)
        dst_id = self._same_match(dest_name)
        if src_id == -1 or dst_id == -1:
            return {"error": "Station not found"}

        distance, path_ids = self.dijkstra(src_id, dst_id)
        
        path_details = []
        for pid in path_ids:
            st = self.stations[pid]
            path_details.append({
                "id": pid,
                "name": st["name"],
                "color": st["color"],
                "arrival_times": st["arrival_times"]
            })
            
        fare_amount = self.calculate_fare(distance)
        
        return {
            "source": self.stations[src_id]["name"],
            "destination": self.stations[dst_id]["name"],
            "distance_km": round(distance, 2) if distance != float('inf') else 0,
            "path": path_details,
            "total_stations": max(0, len(path_ids) - 1),
            "estimated_fare": fare_amount
        }
        
    def calculate_fare(self, distance_km):
        # Base fare calculation logic based on DMRC
        if distance_km <= 2: return 10
        elif distance_km <= 5: return 20
        elif distance_km <= 12: return 30
        elif distance_km <= 21: return 40
        elif distance_km <= 32: return 50
        else: return 60

# Singleton instance for router to use
route_manager = RouteManager(data_dir="data")
