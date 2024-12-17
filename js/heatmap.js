const variableDescriptions = {
    'Total_Transit_Lines': {
        description: 'The total number of public transit lines (bus, rail, etc.) serving the neighborhood.',
        interpretation: 'Higher values indicate better public transportation accessibility.'
    },
    'Average_Rent': {
        description: 'The average monthly rental cost for residential properties in the neighborhood.',
        interpretation: 'Reflects the cost of living and housing market conditions in the area.'
    },
    'Minority_Percentage': {
        description: 'The percentage of neighborhood residents who identify as racial or ethnic minorities.',
        interpretation: 'Indicates the demographic diversity of the neighborhood.'
    },
    'Per_Capita_Income': {
        description: 'The average annual income per person in the neighborhood.',
        interpretation: 'Reflects the economic status of neighborhood residents.'
    },
    'Total_Population': {
        description: 'The total number of residents living in the neighborhood.',
        interpretation: 'Indicates the size and density of the neighborhood.'
    },
    'College_Housing_Percentage': {
        description: 'The percentage of housing units occupied by college students.',
        interpretation: 'Higher values suggest a stronger presence of student population.'
    }
};
function createHeatmap(containerId) {
    // Store the full dataset
    let fullData = null;
    let currentNeighborhood = null;
    let currentHighlight = null;

    // Load the JSON data
    d3.json("data/neighborhood_correlation_matrices.json", function (error, data) {
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

        // Create main container with flex layout
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';
        container.appendChild(mainContainer);

        // Create header (remains centered above both sections)
        const header = document.createElement('div');
        header.className = 'header-container';
        header.innerHTML = `
            <h2 class="heatmap-title">${currentNeighborhood} Correlation Analysis</h2>
            <div class="button-group">
                <button class="control-button" id="highCorr">High Correlations (≥0.7)</button>
                <button class="control-button" id="lowCorr">Low Correlations (≤0.2)</button>
            </div>
        `;
        container.insertBefore(header, mainContainer);

        // Create heatmap container
        const heatmapContainer = document.createElement('div');
        heatmapContainer.className = 'heatmap-section';
        mainContainer.appendChild(heatmapContainer);

        // Create explanation container
        const explanationContainer = document.createElement('div');
        explanationContainer.className = 'explanation-section';
        mainContainer.appendChild(explanationContainer);

        // Set up dimensions
        const margin = { top: 100, right: 100, bottom: 50, left: 100 };
        const width = 600 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

        // Create SVG
        const svg = d3.select(heatmapContainer)
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
            'Total_Transit_Lines': 'Transit Lines',
            'Average_Rent': 'Rent',
            'Minority_Percentage': 'Minority',
            'Per_Capita_Income': 'Income',
            'Total_Population': 'Population',
            'College_Housing_Percentage': 'College Housing'
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

        // Add color legend
        const legendWidth = 20;
        const legendHeight = height;
        const legendData = [1, 0.8, 0.6, 0.4, 0.2, 0];

        // Create legend group
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width + margin.right / 2}, 0)`);

        // Create gradient
        const legendGradient = legend.append('defs')
            .append('linearGradient')
            .attr('id', 'legend-gradient')
            .attr('x1', '0%')
            .attr('x2', '0%')
            .attr('y1', '0%')
            .attr('y2', '100%');

        // Add gradient stops
        legendGradient.selectAll('stop')
            .data([
                { offset: '0%', color: colorScale(1) },
                { offset: '100%', color: colorScale(0) }
            ])
            .enter()
            .append('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color);

        // Add gradient rectangle
        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#legend-gradient)');

        // Add legend axis
        const legendScale = d3.scaleLinear()
            .domain([0, 1])
            .range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale)
            .tickFormat(d3.format('.1f'))
            .tickValues([0, 0.2, 0.4, 0.6, 0.8, 1.0]);

        legend.append('g')
            .attr('transform', `translate(${legendWidth}, 0)`)
            .call(legendAxis);

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
            .on('mouseover', function (d) {
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
            .on('mouseout', function () {
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
        d3.select('#highCorr').on('click', function () {
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

        d3.select('#lowCorr').on('click', function () {
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

        // Add explanation content
        explanationContainer.innerHTML = `
            <h3 class="explanation-header">Understanding the Variables</h3>
            <div class="explanation-list">
                ${Object.entries(variableMap).map(([key, label]) => `
                    <div class="variable-explanation">
                        <h4 class="variable-name">${label}</h4>
                        <p class="variable-description">${variableDescriptions[key]?.description || ''}</p>
                        <p class="variable-interpretation">${variableDescriptions[key]?.interpretation || ''}</p>
                    </div>
                `).join('')}
            </div>
            <div class="correlation-guide">
                <h3>Understanding Correlation Values</h3>
                <ul>
                    <li><strong>1.0:</strong> Perfect positive correlation</li>
                    <li><strong>0.7 to 1.0:</strong> Strong positive correlation</li>
                    <li><strong>0.3 to 0.7:</strong> Moderate positive correlation</li>
                    <li><strong>0.0 to 0.3:</strong> Weak positive correlation</li>
                    <li><strong>0.0:</strong> No correlation</li>
                    <li><strong>Less than 0.0:</strong> Negative correlation</li>
                </ul>
                <p class="correlation-note">Note: Correlation does not imply causation. These values show relationships between variables but do not indicate that one variable causes changes in another.</p>
            </div>
        `;
    }

    // Handle updates from table selection
    function handleTableSelection(selectedNeighborhood) {
        if (!fullData) return;

        // First try to find the specific neighborhood data
        let neighborhoodData = fullData.find(d => d.neighborhood === selectedNeighborhood);

        // If neighborhood not found, use citywide data
        if (!neighborhoodData) {
            console.log(`Neighborhood "${selectedNeighborhood}" not found, using citywide data`);
            neighborhoodData = fullData.find(d => d.neighborhood === "Citywide");
        }

        updateHeatmap(neighborhoodData);
    }

    return {
        update: handleTableSelection
    };
}

const style = document.createElement('style');
style.textContent = `
    #correlation-matrix {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .header-container {
        width: 100%;
        margin-bottom: 20px;
        text-align: center;
    }

    .main-container {
        display: flex;
        gap: 40px;
        align-items: flex-start;
        justify-content: center;
        width: 100%;
    }

    .heatmap-section {
        flex: 0 0 auto;
        display: flex;
        justify-content: center;
    }

    .explanation-section {
        flex: 0 0 400px;
        padding: 20px;
        background: #f8fafc;
        border-radius: 8px;
        overflow-y: auto;
        max-height: 600px;
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

    .explanation-header {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 16px;
        text-align: center;
    }

    .variable-explanation {
        margin-bottom: 20px;
    }

    .variable-name {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
        color: #1e40af;
    }

    .variable-description {
        margin-bottom: 8px;
        font-size: 14px;
        line-height: 1.5;
    }

    .variable-interpretation {
        font-size: 14px;
        color: #4b5563;
        font-style: italic;
    }

    .correlation-guide {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
        text-align: center;
    }

    .correlation-guide h3 {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 12px;
    }

    .correlation-guide ul {
        list-style-type: none;
        padding: 0;
        text-align: left;
    }

    .correlation-guide li {
        margin-bottom: 8px;
        font-size: 14px;
    }

    .correlation-note {
        margin-top: 16px;
        font-size: 14px;
        color: #4b5563;
        font-style: italic;
        text-align: center;
    }

    svg {
        display: block;
    }
    .legend-title {
            font-size: 12px;
            font-weight: bold;
        }
        
        .legend text {
            font-size: 10px;
        }
        
        .legend .domain,
        .legend .tick line {
            stroke: #666;
        }
`;
document.head.appendChild(style);