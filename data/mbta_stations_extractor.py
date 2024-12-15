import requests

MBTA_API = "https://api-v3.mbta.com"

# Documentation: https://api-v3.mbta.com/docs/swagger/index.html
routes = requests.get(f"{MBTA_API}/routes").json()
print("Downloaded", len(routes["data"]), "route(s)")
lines = [i["id"] for i in filter(lambda i: 0 <= i["attributes"]["type"] <= 1, routes["data"])]
print("Found", len(lines), "T line(s):", lines)

output = "Name,Municipality,Line,Latitude,Longitude\n"

for line in lines:
  stations = requests.get(f"{MBTA_API}/stops?filter[route]={line}").json()
  print("Downloaded", len(stations["data"]), "station(s) from the", line, "Line")
  for station in stations["data"]:
    output += f"{station['attributes']['name']},{station['attributes']['municipality']},{line},{station['attributes']['latitude']},{station['attributes']['longitude']}"
    output += "\n"

with open("mbta_stations.csv", "w") as output_file:
  output_file.write(output)
