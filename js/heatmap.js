function createHeatmap(containerId) {
    // Store the full dataset
    let fullData = null;
    let currentNeighborhood = null;
    let currentHighlight = null;

    // Load the JSON data
    d3.json("data/neighborhood_correlation_matrices.json", function(error, data) {
        if (error) {
            console.error("Error loading correlation data:", error);
            return;
        }
        fullData = data;
        // Initialize with first neighborhood
        updateHeatmap(data[data.length - 1]);
    });

    // Transform the correlation matrix into the required format
    function transformData(correlationMatrix) {
        const variables = Object.keys(correlationMatrix);
        return variables.map(variable => {
            const row = { variable };
            variables.forEach(col => {
                row[col] = correlationMatrix[variable][col];
            });
            return row;
        });
    }

    function updateHeatmap(neighborhoodData) {
        if (!neighborhoodData) {
            console.log("No neighborhood data provided");
            return;
        }

        currentNeighborhood = neighborhoodData.neighborhood;

        // Clear existing content
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        // Set up header
        const header = document.createElement('div');
        header.innerHTML = `
            <h2 class="heatmap-title">${currentNeighborhood} Correlation Analysis</h2>
            <div class="button-group">
                <button class="control-button" id="highCorr">High Correlations (≥0.7)</button>
                <button class="control-button" id="lowCorr">Low Correlations (≤0.2)</button>
            </div>
        `;
        container.appendChild(header);

        // Set up dimensions
        const margin = { top: 60, right: 50, bottom: 50, left: 100 };
        const width = 600 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(`#${containerId}`)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create tooltip
        const tooltip = d3.select("body").append('div')
            .attr('class', 'heatmap-tooltip')
            .style('opacity', 0);

        // Transform the data
        const data = transformData(neighborhoodData.correlation_matrix);

        // Get variables
        let variables = Object.keys(data[0]).filter(key => key !== 'variable');
        
        // Variable name mapping
        const variableMap = {
            'Total_Transit_Lines': 'Total Lines Avaialble',
            'Average_Rent': 'Average Rent',
            'Minority_Percentage': 'Percentage of Minority',
            'Per_Capita_Income': 'Average Income',
            'Total_Population': 'Total Population',
            'College_Housing_Percentage': 'Percentage of College'
        };

        // Create scales
        const x = d3.scaleBand()
            .range([0, width])
            .domain(variables)
            .padding(0.05);

        const y = d3.scaleBand()
            .range([0, height])
            .domain(variables)
            .padding(0.05);

        const colorScale = d3.scaleLinear()
            .domain([0, 1])
            .range(['#f0f9e8', '#08589e']);

        // Create axes
        svg.append('g')
            .style('font-size', '12px')
            .call(d3.axisTop(x))
            .selectAll('text')
            .text(d => variableMap[d] || d)
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'start')
            .attr('dx', '0.8em')
            .attr('dy', '0.5em');

        svg.append('g')
            .style('font-size', '12px')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .text(d => variableMap[d] || d);

        // Create heatmap cells
        const cells = svg.selectAll('rect')
            .data(data.flatMap(row => 
                variables.map(col => ({
                    row: row.variable,
                    col,
                    value: row[col]
                }))
            ))
            .enter()
            .append('rect')
            .attr('x', d => x(d.col))
            .attr('y', d => y(d.row))
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .style('fill', d => colorScale(d.value))
            .style('stroke', 'white')
            .style('stroke-width', 1);

        // Add hover interactions
        cells
            .on('mouseover', function(d) {
                d3.select(this)
                    .style('stroke', '#2563eb')
                    .style('stroke-width', '2px');
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                
                tooltip.html(`${variableMap[d.row] || d.row} × ${variableMap[d.col] || d.col}<br/>Correlation: ${d.value.toFixed(3)}`)
                    .style('left', (d3.event.pageX + 10) + 'px')
                    .style('top', (d3.event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('stroke', 'white')
                    .style('stroke-width', '1px');
                
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Add correlation values
        svg.selectAll('text.value')
            .data(data.flatMap(row => 
                variables.map(col => ({
                    row: row.variable,
                    col,
                    value: row[col]
                }))
            ))
            .enter()
            .append('text')
            .attr('class', 'value')
            .attr('x', d => x(d.col) + x.bandwidth() / 2)
            .attr('y', d => y(d.row) + y.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '11px')
            .style('fill', d => d.value > 0.5 ? 'white' : 'black')
            .text(d => d.value.toFixed(2));

        // Highlighting function
        function updateHighlight(mode) {
            const isHighCorrelation = value => value >= 0.7;
            const isLowCorrelation = value => value <= 0.2 && value > 0;

            cells.style('opacity', d => {
                if (!mode) return 1;
                if (mode === 'high' && isHighCorrelation(d.value)) return 1;
                if (mode === 'low' && isLowCorrelation(d.value)) return 1;
                return 0.3;
            });

            svg.selectAll('text.value')
                .style('opacity', d => {
                    if (!mode) return 1;
                    if (mode === 'high' && isHighCorrelation(d.value)) return 1;
                    if (mode === 'low' && isLowCorrelation(d.value)) return 1;
                    return 0.3;
                });
        }

        // Button handlers
        d3.select('#highCorr').on('click', function() {
            const isActive = d3.select(this).classed('active');
            d3.selectAll('.control-button').classed('active', false);
            if (!isActive) {
                d3.select(this).classed('active', true);
                currentHighlight = 'high';
            } else {
                currentHighlight = null;
            }
            updateHighlight(currentHighlight);
        });

        d3.select('#lowCorr').on('click', function() {
            const isActive = d3.select(this).classed('active');
            d3.selectAll('.control-button').classed('active', false);
            if (!isActive) {
                d3.select(this).classed('active', true);
                currentHighlight = 'low';
            } else {
                currentHighlight = null;
            }
            updateHighlight(currentHighlight);
        });
    }

    // Handle updates from table selection
    function handleTableSelection(selectedNeighborhood) {
        if (!fullData) return;
        
        const neighborhoodData = fullData.find(d => d.neighborhood === selectedNeighborhood);
        if (neighborhoodData) {
            updateHeatmap(neighborhoodData);
        } else {
            console.log("Neighborhood not found:", selectedNeighborhood);
        }
    }

    return {
        update: handleTableSelection
    };
}

const style = document.createElement('style');
style.textContent = `
    #correlation-matrix {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    .heatmap-container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .heatmap-title {
        text-align: center;
        margin: 20px 0;
        font-size: 24px;
        font-weight: bold;
    }

    .button-group {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin: 20px 0;
    }

    .control-button {
        padding: 8px 16px;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        background-color: white;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
    }

    .control-button.active {
        background-color: #2563eb;
        color: white;
        border-color: #2563eb;
    }

    .heatmap-tooltip {
        position: absolute;
        pointer-events: none;
        z-index: 100;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        transition: opacity 0.2s;
    }

    svg {
        display: block;
        margin: 0 auto;
    }

    .tick text {
        font-size: 12px;
        font-weight: 500;
    }

    .value {
        font-size: 11px;
        font-weight: 500;
    }
`;
document.head.appendChild(style);