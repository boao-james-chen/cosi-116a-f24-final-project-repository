import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as d3 from 'd3';

const sampleData = [
  { variable: 'Lines', Lines: 1, Rent: 0.2, Minority: 0.35, Income: 0.15, Population: 0.25 },
  { variable: 'Income', Lines: 0.2, Rent: 1, Minority: 0.8, Income: 0.1, Population: 0.05 },
  { variable: 'Rent', Lines: 0.35, Rent: 0.8, Minority: 1, Income: 0.15, Population: 0.1 },
  { variable: 'Population', Lines: 0.15, Rent: 0.1, Minority: 0.15, Income: 1, Population: 0.6 },
  { variable: 'Minority', Lines: 0.25, Rent: 0.05, Minority: 0.1, Income: 0.6, Population: 1 }
];

const CorrelationHeatmap = () => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const [data] = useState(sampleData);
  const [sortOrder, setSortOrder] = useState({ variable: null, ascending: true });
  const [highlightMode, setHighlightMode] = useState(null);

  const isHighCorrelation = value => value >= 0.7;
  const isLowCorrelation = value => value <= 0.2 && value > 0;

  useEffect(() => {
    if (!svgRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 80, right: 70, bottom: 50, left: 70 };
    const width = 600 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    let variables = Object.keys(data[0]).filter(key => key !== 'variable');

    if (sortOrder.variable) {
      variables = variables.filter(v => v !== sortOrder.variable);
      
      variables.sort((a, b) => {
        const aValue = data.find(d => d.variable === sortOrder.variable)[a];
        const bValue = data.find(d => d.variable === sortOrder.variable)[b];
        return sortOrder.ascending ? bValue - aValue : aValue - bValue;
      });

      variables.unshift(sortOrder.variable);
    }

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

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select(tooltipRef.current)
      .style('position', 'fixed')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 100);

    if (sortOrder.variable) {
      svg.append('text')
        .attr('class', 'sort-indicator')
        .attr('x', 0)
        .attr('y', -40)
        .attr('text-anchor', 'start')
        .style('fill', '#2563eb')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text(`Sorted by: ${sortOrder.variable} ${sortOrder.ascending ? '↑' : '↓'}`);
    }

    const xAxis = svg.append('g')
      .style('font-size', '12px')
      .call(d3.axisTop(x));

    xAxis.selectAll('text')
      .style('text-anchor', 'start')
      .attr('dx', '0.8em')
      .attr('dy', '0.5em')
      .attr('transform', 'rotate(-45)')
      .style('cursor', 'pointer')
      .style('fill', d => d === sortOrder.variable ? '#2563eb' : 'black')
      .style('font-weight', d => d === sortOrder.variable ? 'bold' : 'normal')
      .on('click', function(event, d) {
        setSortOrder(prev => ({
          variable: d,
          ascending: prev.variable === d ? !prev.ascending : true
        }));
      });

    svg.append('g')
      .style('font-size', '12px')
      .call(d3.axisLeft(y));

    svg.selectAll('rect')
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
      .style('stroke-width', 1)
      .style('opacity', d => {
        if (!highlightMode) return 1;
        if (highlightMode === 'high' && isHighCorrelation(d.value)) return 1;
        if (highlightMode === 'low' && isLowCorrelation(d.value)) return 1;
        return 0.3;
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .style('stroke', '#2563eb')
          .style('stroke-width', 2);

        tooltip
          .style('opacity', 1)
          .html(`
            <div class="bg-black text-white px-3 py-2 rounded-lg text-sm shadow-lg">
              <div><b>${d.row} × ${d.col}</b></div>
              <div>Correlation: ${d.value.toFixed(3)}</div>
            </div>
          `)
          .style('left', `${event.clientX + 5}px`)
          .style('top', `${event.clientY - tooltip.node().offsetHeight - 5}px`);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', `${event.clientX + 5}px`)
          .style('top', `${event.clientY - tooltip.node().offsetHeight - 5}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('stroke', 'white')
          .style('stroke-width', 1);
        tooltip.style('opacity', 0);
      });

    svg.selectAll('text.value')
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
      .style('opacity', d => {
        if (!highlightMode) return 1;
        if (highlightMode === 'high' && isHighCorrelation(d.value)) return 1;
        if (highlightMode === 'low' && isLowCorrelation(d.value)) return 1;
        return 0.3;
      })
      .text(d => d.value.toFixed(2));

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

    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        svg.attr('transform', event.transform);
      });

    d3.select(svgRef.current)
      .call(zoom);

  }, [data, sortOrder, highlightMode]);

  return (
    <Card className="w-full max-w-4xl bg-white">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Boston citywide</CardTitle>
        <div className="flex justify-center gap-4 mt-4">
          <Button 
            variant={highlightMode === 'high' ? "default" : "outline"}
            onClick={() => setHighlightMode(highlightMode === 'high' ? null : 'high')}
          >
            High Correlations (≥0.7)
          </Button>
          <Button 
            variant={highlightMode === 'low' ? "default" : "outline"}
            onClick={() => setHighlightMode(highlightMode === 'low' ? null : 'low')}
          >
            Low Correlations (≤0.2)
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="overflow-hidden">
          <svg ref={svgRef} />
          <div ref={tooltipRef} />
        </div>
      </CardContent>
    </Card>
  );
};

export default CorrelationHeatmap;
