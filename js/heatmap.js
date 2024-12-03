// Maintain state for the visualization
let currentHighlight = null;
let currentSort = { variable: null, ascending: true };

const sampleData = [
    { variable: 'Lines', Lines: 1, Rent: 0.2, Minority: 0.35, Income: 0.15, Population: 0.25 },
    { variable: 'Income', Lines: 0.2, Rent: 1, Minority: 0.8, Income: 0.1, Population: 0.05 },
    { variable: 'Rent', Lines: 0.35, Rent: 0.8, Minority: 1, Income: 0.15, Population: 0.1 },
    { variable: 'Population', Lines: 0.15, Rent: 0.1, Minority: 0.15, Income: 1, Population: 0.6 },
    { variable: 'Minority', Lines: 0.25, Rent: 0.05, Minority: 0.1, Income: 0.6, Population: 1 }
];

// Add the CSS styles to the document
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .tooltip {
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
        .control-button {
            padding: 8px 16px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            background-color: white;
            cursor: pointer;
            transition: all 0.2s;
        }
        .control-button.active {
            background-color: #2563eb;
            color: white;
            border-color: #2563eb;
        }
        .button-group {
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .axis-label {
            cursor: pointer;
        }
        .axis-label:hover {
            fill: #2563eb;
        }
    `;
    document.head.appendChild(style);
}

// Helper functions
const isHighCorrelation = value => value >= 0.7;
const isLowCorrelation = value => value <= 0.2 && value > 0;

function createHeatmap(containerId, data = sampleData) {
    // Add styles if not already added
    if (!document.querySelector('style')) {
        addStyles();
    }

    // Clear any existing content
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // Create button group
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    buttonGroup.innerHTML = `
        <button class="control-button" id="highCorr">High Correlations (≥0.7)</button>
        <button class="control-button" id="lowCorr">Low Correlations (≤0.2)</button>
    `;
    container.appendChild(buttonGroup);

    // Create visualization container
    const vizContainer = document.createElement('div');
    vizContainer.id = 'heatmap-viz';
    container.appendChild(vizContainer);

    // Set up dimensions
    const margin = { top: 80, right: 70, bottom: 50, left: 70 };
    const width = 600 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select('#heatmap-viz')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create tooltip
    const tooltip = d3.select('#' + containerId)  
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'fixed')  
        .style('visibility', 'hidden') 
        .style('background-color', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('z-index', '9999');

    // Get variables and handle sorting
    let variables = Object.keys(data[0]).filter(key => key !== 'variable');
    if (currentSort.variable) {
        variables = variables.filter(v => v !== currentSort.variable);
        variables.sort((a, b) => {
            const aValue = data.find(d => d.variable === currentSort.variable)[a];
            const bValue = data.find(d => d.variable === currentSort.variable)[b];
            return currentSort.ascending ? bValue - aValue : aValue - bValue;
        });
        variables.unshift(currentSort.variable);
    }

    // Create scales
    const x = d3.scaleBand()
        .range([0, width])
        .domain(variables)
        .padding(0.05);

    const y = d3.scaleBand()
        .range([0, height])
        .domain(variables)
        .padding(0.05);

    const colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateYlGnBu)
        .domain([0, 1]);

    // Add sort indicator if needed
    if (currentSort.variable) {
        svg.append('text')
            .attr('class', 'sort-indicator')
            .attr('x', 0)
            .attr('y', -40)
            .style('fill', '#2563eb')
            .style('font-size', '14px')
            .text(`Sorted by: ${currentSort.variable} ${currentSort.ascending ? '↑' : '↓'}`);
    }

    // Create axes
    const xAxis = svg.append('g')
        .style('font-size', '12px')
        .call(d3.axisTop(x));

    xAxis.selectAll('text')
        .attr('class', 'axis-label')
        .style('text-anchor', 'start')
        .attr('dx', '0.8em')
        .attr('dy', '0.5em')
        .attr('transform', 'rotate(-45)')
        .style('fill', d => d === currentSort.variable ? '#2563eb' : 'black')
        .style('font-weight', d => d === currentSort.variable ? 'bold' : 'normal')
        .on('click', function(event, d) {
            currentSort = {
                variable: d,
                ascending: currentSort.variable === d ? !currentSort.ascending : true
            };
            container.innerHTML = '';
            createHeatmap(containerId, data);
        });

    svg.append('g')
        .style('font-size', '12px')
        .call(d3.axisLeft(y));

    // Create heatmap cells
    const cells = svg.selectAll('rect')
        .data(data.flatMap(row => 
            variables.map(col => ({
                row: row.variable,
                col,
                value: row[col]
            }))
        ))
        .join('rect')
        .attr('x', d => x(d.col))
        .attr('y', d => y(d.row))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', d => colorScale(d.value))
        .style('stroke', 'white')
        .style('stroke-width', 1);

    // Add hover effects and tooltip
    cells
        .on('mouseover', function(event, d) {
            // Log event for debugging
            console.log('mouseover event:', event, 'd:', d);
            
            d3.select(this)
                .style('stroke', '#2563eb')
                .style('stroke-width', '2px');

            // Show tooltip with fixed positioning
            tooltip
                .style('visibility', 'visible')
                .html(`
                    <div style="text-align: center;">
                        <strong>${d.row} × ${d.col}</strong><br/>
                        Correlation: ${d.value.toFixed(3)}
                    </div>
                `)
                .style('left', (event.clientX + 10) + 'px')
                .style('top', (event.clientY - 28) + 'px');
        })
        .on('mousemove', function(event) {
            
            tooltip
                .style('left', (event.clientX + 10) + 'px')
                .style('top', (event.clientY - 28) + 'px');
        })
        .on('mouseout', function(event) {
            
            // Remove highlight
            d3.select(this)
                .style('stroke', 'white')
                .style('stroke-width', '1px');

            // Hide tooltip
            tooltip
                .style('visibility', 'hidden');
        });

    // Add correlation values as text
    const textLabels = svg.selectAll('text.value')
        .data(data.flatMap(row => 
            variables.map(col => ({
                row: row.variable,
                col,
                value: row[col]
            }))
        ))
        .join('text')
        .attr('class', 'value')
        .attr('x', d => x(d.col) + x.bandwidth() / 2)
        .attr('y', d => y(d.row) + y.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '11px')
        .style('fill', d => d.value > 0.5 ? 'white' : 'black')
        .text(d => d.value.toFixed(2));

    // Add legend
    const legendWidth = 20;
    const legendHeight = height;
    const legend = svg.append('g')
        .attr('transform', `translate(${width + margin.right/2}, 0)`);

    const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
        .attr('y2', '0%');

    d3.range(0, 1.1, 0.1).forEach(stop => {
        gradient.append('stop')
            .attr('offset', `${stop * 100}%`)
            .attr('stop-color', colorScale(stop));
    });

    legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#legend-gradient)');

    const legendScale = d3.scaleLinear()
        .domain([0, 1])
        .range([legendHeight, 0]);

    legend.append('g')
        .call(d3.axisRight(legendScale)
            .ticks(5)
            .tickFormat(d3.format('.1f')))
        .attr('transform', `translate(${legendWidth}, 0)`);

    legend.append('text')
        .attr('x', legendWidth / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Correlation');

    // Update functions for highlighting
    function updateHighlight(mode) {
        cells.style('opacity', d => {
            if (!mode) return 1;
            if (mode === 'high' && isHighCorrelation(d.value)) return 1;
            if (mode === 'low' && isLowCorrelation(d.value)) return 1;
            return 0.3;
        });
        textLabels.style('opacity', d => {
            if (!mode) return 1;
            if (mode === 'high' && isHighCorrelation(d.value)) return 1;
            if (mode === 'low' && isLowCorrelation(d.value)) return 1;
            return 0.3;
        });
    }

    // Set up button handlers
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

    // Apply current highlight if any
    if (currentHighlight) {
        updateHighlight(currentHighlight);
        d3.select(currentHighlight === 'high' ? '#highCorr' : '#lowCorr')
            .classed('active', true);
    }
}

// Make createHeatmap available globally
window.createHeatmap = createHeatmap;