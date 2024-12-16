import requests
import json
from sys import argv

if len(argv) <= 2:
  neighborhood_file = "neighborhood_stations.json"
else:
  neighborhood_file = argv[1]

MBTA_API = "https://api-v3.mbta.com"

# Documentation: https://api-v3.mbta.com/docs/swagger/index.html
routes = requests.get(f"{MBTA_API}/routes").json()
print("Downloaded", len(routes["data"]), "route(s)")
lines = [i["id"] for i in filter(lambda i: 0 <= i["attributes"]["type"] <= 1, routes["data"])]
print("Found", len(lines), "T line(s):", lines)

with open(neighborhood_file, "r") as neighborhood_file:
  neighborhoods = json.load(neighborhood_file)

output = "Name,Municipality,Line,Latitude,Longitude\n"

for line in lines:
  stations = requests.get(f"{MBTA_API}/stops?filter[route]={line}").json()
  print("Downloaded", len(stations["data"]), "station(s) from the", line, "Line")
  for station in stations["data"]:
    station_name = station['attributes']['name']
    line_equivalent = line if line != "Mattapan" else "Red"
    for neighborhood, data in neighborhoods.items():
      if station_name in data[line_equivalent]:
        station["attributes"]["municipality"] = neighborhood
      
    output += f"{station_name},{station['attributes']['municipality']},{line},{station['attributes']['latitude']},{station['attributes']['longitude']}"
    output += "\n"

with open("mbta_stations.csv", "w") as output_file:
  output_file.write(output)
