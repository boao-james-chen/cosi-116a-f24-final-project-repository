function table() {

  console.log("top of table")

  let ourBrush = null,
    selectableElements = d3.select(null),
    dispatcher;

  // Create the chart by adding an svg to the div with the id 
  // specified by the selector using the given data
  function chart(selector, data) {
    console.log("in chart")

    let table = d3.select(selector)
      .append("table")
        .classed("my-table", true)
        .classed("text-unselectable", true);

    // headers should be each metro line
    let tableHeaders = ['Blue', 'Green-A', 'Green-B', 'Green-C', 'Green-D', 'Orange', 'Red', 'Silver']

    let tr = table.append('thead').append('tr')
    tr.selectAll('th').data(tableHeaders).enter().append('th').text((d) => d)

    let tbody = table.append('tbody')

    console.log("in table")
    console.log(data)

    // let rows = tbody.selectAll('tr')
    //   .data(data)
    //   .enter()
    //   .append('tr')
    //   .selectAll('td')
    //   .data(data => Object.values(data))
    //   .enter()
    //   .append('td')
    //   .text((d) => d)

    return chart;

  }

  return chart;

}