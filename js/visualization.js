// visualization.js
(() => {

  d3.json("data/neighborhood_stations.json", data => {
    try {
      console.log("Data loaded:", data);

      const dispatchString = "selectionUpdated";

      // Create table visualization
      console.log("Creating table...");
      if (typeof table === 'undefined') {
      console.error("table function is not defined!");
      return;
      }

      let selectionTable = table()
      ("#table", data);

      // Create heatmap
      console.log("Creating heatmap...");
      if (typeof createHeatmap === 'undefined') {
      console.error("createHeatmap function is not defined!");
      return;
      }
      createHeatmap('correlation-matrix');
    } 
    catch (error) {
      console.error("Error loading the data:", error);
    }
  });

  const bounds = {
    topLeft: { lat: 42.445, lng: -71.275 },
    bottomRight: { lat: 42.205, lng: -70.975 }
  };

  // Define colors for lines
  const lineColors = {
    Red: "#FF0000",
    Mattapan: "#FF9999",
    Orange: "#FFA500",
    "Green-B": "#008000",
    "Green-C": "#008000",
    "Green-D": "#008000",
    "Green-E": "#008000",
    Blue: "#0000FF"
  };

  // Map dimensions
  const mapElement = document.getElementById("boston-map");
  const svg = d3.select("#boston-map-overlay");

  // Tooltip
  const tooltip = d3.select(".map-tooltip");

  // Convert geographic coordinates to pixel positions
  function project(lat, lng, imgWidth, imgHeight) {
    const xScale = imgWidth / (bounds.bottomRight.lng - bounds.topLeft.lng);
    const yScale = imgHeight / (bounds.topLeft.lat - bounds.bottomRight.lat);

    const x = (lng - bounds.topLeft.lng) * xScale;
    const y = (bounds.topLeft.lat - lat) * yScale;

    return { x, y };
  }

    // Load station data and plot lines and points

    // Load station data and plot lines and points
    d3.request("data/mbta_stations.csv")
      .mimeType("text/csv")
      .response(function(xhr) { return d3.csvParse(xhr.responseText); })
      .get(function(error, data) {
        if (error) throw error;

        const imgWidth = mapElement.offsetWidth;
        const imgHeight = mapElement.offsetHeight;

        // Group data by line
        const lines = d3.nest()
          .key(d => d.Line)
          .entries(data);

        // Store plotted stations and their lines
        const stationMap = new Map();

        // Draw lines
        lines.forEach(function(line) {
          const coordinates = line.values.map(d =>
                              project(Number(d.Latitude), Number(d.Longitude), imgWidth, imgHeight));

          svg.append("path")
            .datum(coordinates)
            .attr("class", "line")
            .attr("d", d3.line()
              .x(d => d.x)
              .y(d => d.y))
            .attr("stroke", lineColors[line.key] || "#000")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round");
        });

        // Draw stations
        data.forEach(function(d) {
          // Make sure we don't draw a station twice
          const stationKey = `${d.Name}-${d.Latitude}-${d.Longitude}`;

          if (!stationMap.has(stationKey)) {
            stationMap.set(stationKey, { lines: new Set(), municipalities: new Set() });
          }

          const stationInfo = stationMap.get(stationKey);
          stationInfo.lines.add(d.Line);
          stationInfo.municipalities.add(d.Municipality);

          const { x, y } = project(Number(d.Latitude), Number(d.Longitude), imgWidth, imgHeight);

          if (!stationInfo.circle) {
            stationInfo.circle = svg.append("circle")
              .attr("cx", x)
              .attr("cy", y)
              .attr("r", 5)
              .attr("class", "station")
              .attr("fill", lineColors[d.Line] || "#000")
              .on("mouseover", function() {
                tooltip.style("display", "block")
                     .html(
                       `<b>${d.Name}</b><br>` +
                       `  Lines: ${[...stationInfo.lines].join(", ")}<br>` +
                       `  Municipality: ${[...stationInfo.municipalities].join(", ")}`
                     );
              })
              .on("mousemove", function() {
                tooltip.style("top", (d3.event.pageY + 10) + "px")
                     .style("left", (d3.event.pageX + 10) + "px");
              })
              .on("mouseout", function() {
                tooltip.style("display", "none");
              });
          }

          // If multiple lines share a station, color it dark gray
          if (stationInfo.lines.size > 1) {
            stationInfo.circle.attr("fill", "#444");
          }
        });
      });

    // // Adjust map and points on window resize
    // window.addEventListener("resize", function() {
    //   const imgWidth = mapElement.offsetWidth;
    //   const imgHeight = mapElement.offsetHeight;

    //   svg.selectAll("path.line").attr("d", function() {
    //     const coordinates = d3.select(this).datum();
    //     return d3.line()
    //       .x(d => project(d.lat, d.lng, imgWidth, imgHeight).x)
    //       .y(d => project(d.lat, d.lng, imgWidth, imgHeight).y)(coordinates);
    //   });

    //   svg.selectAll("circle").each(function() {
    //     const circle = d3.select(this);
    //     const { x, y } = project(+circle.attr("data-lat"), +circle.attr("data-lng"), imgWidth, imgHeight);
    //     circle.attr("cx", x).attr("cy", y);
    //   });
    // });
})();
