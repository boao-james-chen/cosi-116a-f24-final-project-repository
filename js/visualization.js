// visualization.js

(() => {
  const bounds = {
    topLeft: { lat: 42.445, lng: -71.275 },
    bottomRight: { lat: 42.205, lng: -70.975 }
  };
  
  // Define colors for lines
  const lineColors = {
    Red: "#FF0000",
    Mattapan: "#FF6666",
    Orange: "#FFA500",
    "Green-B": "#008000",
    "Green-C": "#008000",
    "Green-D": "#008000",
    "Green-E": "#008000",
    Blue: "#0000FF"
  };
  
  // Map dimensions
  const mapImage = document.getElementById("boston-map");
  const mapOverlay = d3.select("#boston-map-overlay");
  
  // Tooltip
  const tooltip = d3.select(".map-tooltip");
  
  // Convert geographic coordinates to pixel positions
  function project(lat, lng, canvasWidth, canvasHeight) {
    const xScale = canvasWidth / (bounds.bottomRight.lng - bounds.topLeft.lng);
    const yScale = canvasHeight / (bounds.topLeft.lat - bounds.bottomRight.lat);
  
    const x = (lng - bounds.topLeft.lng) * xScale;
    const y = (bounds.topLeft.lat - lat) * yScale;
  
    return { x, y };
  }
  
  let stationsData, shapeData;
  let selectionTable, dispatcher;
  
  const dispatchString = "selectionUpdated";

  d3.json("data/neighborhood_stations.json", data => {
    try {
      // console.log("Data loaded:", data);

      // Create table visualization
      // console.log("Creating table...");
      if (typeof table === 'undefined') {
        console.error("table function is not defined!");
        return;
      }

      selectionTable = table()
        .selectionDispatcher(d3.dispatch(dispatchString))
        ("#table", data);
      dispatcher = selectionTable.selectionDispatcher();

      // Create heatmap
      // console.log("Creating heatmap...");
      if (typeof createHeatmap === 'undefined') {
        console.error("createHeatmap function is not defined!");
        return;
      }
      const heatmap = createHeatmap('correlation-matrix');

      dispatcher.on(dispatchString, (selectedData) => {
        if (typeof selectedData !== 'string' || selectedData.startsWith("station")) {
          return;
        }
        mapOverlay.selectAll("*").remove();
        mapHighlight = selectedData;
        drawMap();

        const neighborhood = selectedData.split(',')[1];
        try {
          heatmap.update(neighborhood);
        } catch (error) {
          console.error("Error updating heatmap:", error);
        }
      });

    }
    catch (error) {
      console.error("Error loading the data:", error);
    }
  });

  d3.queue()
    .defer(d3.request, "data/mbta_stations.csv")
    .defer(d3.json, "data/mbta_shapes.json")
    .await(mapReady);

  // Load map data and plot lines and points
  function mapReady(error, stationResponse, shapeResponse) {
    if (error) throw error;

    stationsData = d3.csvParse(stationResponse.responseText);
    shapeData = shapeResponse;

    drawMap();
  }

  let mapHighlight = "";

  function drawMap() {
    const imgWidth = mapImage.offsetWidth;
    const imgHeight = mapImage.offsetHeight;

    mapOverlay.attr("width", imgWidth)
      .attr("height", imgHeight); // fix size of overlay

    // Group data by line
    const lines = d3.nest()
      .key(d => d.Line)
      .entries(stationsData);

    // Store plotted stations and their lines
    const stationMap = new Map();

    let highlightedNeighborhood = null;
    let highlightedLine = null;
    let highlightedStations = [];
    switch (mapHighlight.slice(0, mapHighlight.indexOf(','))) {
      case "neighborhood":
        highlightedNeighborhood = mapHighlight.slice(mapHighlight.indexOf(',') + 1);
        break;
      case "line":
        highlightedLine = mapHighlight.slice(mapHighlight.indexOf(',') + 1);
        break;
      case "table/station":
        highlightedStations = mapHighlight.split(", ");
        highlightedStations[0] = highlightedStations[0].slice(highlightedStations[0].lastIndexOf(',') + 1);
        break;
    }

    // Draw polylines for each line
    for (const line in shapeData) {
      shapeData[line].forEach(encodedPolyline => {
        const decoded = polyline.decode(encodedPolyline);
        const projectedCoordinates = decoded.map(coords => {
          const [lat, lng] = coords;
          return project(lat, lng, imgWidth, imgHeight);
        });

        const strokeWidth = (highlightedLine === line || (highlightedLine === "Red" && line === "Mattapan")) ? 7 : 3;
        mapOverlay.append("path")
          .datum(projectedCoordinates)
          .attr("class", "line")
          .attr("d", d3.line()
            .x(d => d.x)
            .y(d => d.y))
          .attr("stroke", lineColors[line] || "#000")
          .attr("stroke-width", strokeWidth)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round");
      });
    }

    // Draw stations
    stationsData.forEach(function (d) {
      // Make sure we don't draw a station twice
      const stationKey = `${d.Name}%${d.Latitude}%${d.Longitude}`;

      if (!stationMap.has(stationKey)) {
        stationMap.set(stationKey, { lines: new Set(), municipalities: new Set() });
      }

      const stationInfo = stationMap.get(stationKey);
      stationInfo.lines.add(d.Line);
      stationInfo.municipalities.add(d.Municipality);

      const { x, y } = project(Number(d.Latitude), Number(d.Longitude), imgWidth, imgHeight);

      const radius = ((highlightedNeighborhood && stationInfo.municipalities.has(highlightedNeighborhood))
                      || highlightedStations.includes(stationKey.slice(0, stationKey.indexOf('%')))) ? 8 : 5;
      if (!stationInfo.circle) {
        stationInfo.circle = mapOverlay.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", radius)
          .attr("class", "station")
          .attr("fill", lineColors[d.Line] || "#000")
          .on("mouseover", () => {
            tooltip.style("display", "block")
              .html(
                `<b>${d.Name}</b><br>` +
                `  Lines: ${[...stationInfo.lines].join(", ")}<br>` +
                `  Municipality: ${[...stationInfo.municipalities].join(", ")}`
              );
            stationInfo.circle.attr("r", 8);
            dispatcher.call(dispatchString, this, "station," + d.Name);
          })
          .on("mousemove", () => {
            tooltip.style("top", (d3.event.pageY + 10) + "px")
              .style("left", (d3.event.pageX + 10) + "px");
          })
          .on("mouseout", () => {
            tooltip.style("display", "none");
            stationInfo.circle.attr("r", radius);
          });
      }

      // If multiple lines share a station, color it dark gray
      if (stationInfo.lines.size > 1) {
        stationInfo.circle.attr("fill", "#777");
      }
    });
  }

  // Redraw everything on window resize
  window.addEventListener("resize", () => {
    mapOverlay.selectAll("*").remove();
    drawMap();
  });

  document.querySelector("#line-colors-table")?.querySelectorAll("span").forEach(line => {
    line.style.color = lineColors[line.textContent] || "#000";
  });
})();
