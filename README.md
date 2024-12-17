[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/h8SwtrsU)
# COSI 116A Final Project

Project Team 19: Public Transportation, housing, and population, COSI 116A F24

## The GitHub Pages Website

See the complete project: https://boao-james-chen.github.io/cosi-116a-f24-final-project-repository/

## Setup

1. Clone this repository **RECURSIVELY** to your local machine. E.g., in your terminal / command prompt `CD` to where you want this the folder for this activity to be. Then run `git clone https://github.com/boao-james-chen/cosi-116a-f24-final-project-repository.git --recursive`
1. In `README.md` update the URL above to point to your GitHub pages website.
1. `CD` or open a terminal / command prompt window into the cloned folder.
1. Start a simple python webserver. E.g., one of these commands:
    * `python -m http.server 8000`
    * `python3 -m http.server 8000`
    * `py -m http.server 8000`
    If you are using Python 2 you will need to use `python -m SimpleHTTPServer 8000` instead, but please switch to Python 3 as [Python 2 was sunset on 2020.01.01](https://www.python.org/doc/sunset-python-2/).
1. Wait for the output: `Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/)`
1. Now open your web browser (Firefox or Chrome) and navigate to the URL: http://localhost:8000

## Updating Data

* To get the latest MBTA line shapes and stations data, run our scrape script in the `data` directory together with our neighborhood data. It should save the data to `mbta_shapes.json` and `mbta_stations.csv`.

```
cd data
python mbta_stations_extractor.py neighborhood_stations.json
```

## Root Files

* `README.md` is this explanatory file for the repo.
* `index.html` contains the main website content. It includes comments surrounded by `<!--` and `-->` to help guide you through making your edits.
* `style.css` contains the CSS.
* `LICENCE` is the source code license.