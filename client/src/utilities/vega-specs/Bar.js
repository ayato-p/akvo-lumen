export default function getVegaBarSpec(visualisation, data, containerHeight, containerWidth) {
  const hasAggregation = Boolean(visualisation.spec.datasetGroupColumnX);
  const dataArray = data.map(item => item);
  const transformType = hasAggregation ? visualisation.spec.aggregationTypeY : null;
  const spec = visualisation.spec;

  if (hasAggregation) {
    const transform1 = {
      name: 'summary',
      source: 'table',
      transform: [
        {
          type: 'aggregate',
          groupby: ['aggregationValue'],
          summarize: {
            y: [
              transformType,
            ],
            sortValue: [
              transformType,
            ],
            colorValue: [
              transformType,
            ],
          },
        },
      ],
    };
    dataArray.push(transform1);
  }

  const dataSource = hasAggregation ? 'summary' : 'table';
  const hasSort = visualisation.spec.datasetSortColumnX !== null;
  const fieldX = hasAggregation ? 'aggregationValue' : 'x';
  const fieldY = hasAggregation ? `${transformType}_y` : 'y';
  const fieldC = hasAggregation ? `${transformType}_colorValue` : 'colorValue';

  let sort = null;
  let reverse = false;

  /*
  if (hasAggregation && hasSort) {
    // Vega won't use an operation on text, so just set sort to "true" for text types
    sort = visualisation.spec.datasetSortColumnXType === 'text' ? 'true' : {
      field: `${transformType}_sortValue`,
      op: transformType,
    };
    reverse = visualisation.spec.reverseSortX;
  }
  */

  let out = {
    data: dataArray,
    width: containerWidth - 70,
    height: containerHeight - 96,
    padding: {
      top: 26,
      left: 60,
      bottom: 70,
      right: 10,
    },
    scales: [
      {
        name: 'x',
        type: 'ordinal',
        range: 'width',
        domain: {
          data: dataSource,
          field: fieldX,
          sort: spec.sortOption === 'none' ? null : {
            field: fieldY,
            op: 'mean',
          },
        },
        reverse: spec.sortOption === 'dsc' ? 'true' : null,
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        domain: {
          data: dataSource,
          field: fieldY,
        },
        nice: true,
      },
    ],
    axes: [
      {
        type: 'x',
        scale: 'x',
        title: visualisation.spec.labelX,
        tickPadding: 0,
        properties: {
          labels: (visualisation.spec.datasetNameColumnX === null && !hasAggregation) ?
            // Supply an empty object to use the default axis labels
            {}
            :
            // Force the axis labels to be blank - we will provide our own
            {
              text: {
                value: '',
              },
            }
          ,
        },
      },
      {
        type: 'y',
        scale: 'y',
        title: visualisation.spec.labelY,
      },
    ],
    marks: [
      {
        name: 'bars',
        type: 'rect',
        from: {
          data: dataSource,
        },
        properties: {
          enter: {
            x: {
              scale: 'x',
              field: fieldX,
            },
            width: {
              scale: 'x',
              band: true,
              offset: -1,
            },
            y: {
              scale: 'y',
              field: fieldY,
            },
            y2: {
              scale: 'y',
              value: 0,
            },
          },
          update: {
            fill: {
              value: 'rgb(149, 150, 184)',
            },
            stroke: {
              value: 'rgba(0, 0, 0, 0.25)',
            }
          },
          hover: {
            fill: {
              value: 'rgb(43, 182, 115)',
            },
          },
        },
      },
      {
        type: 'text',
        from: {
          data: dataSource,
        },
        properties: {
          enter: {
            x: {
              scale: 'x',
              field: fieldX,
            },
            y: {
              scale: 'y',
              value: 0,
              offset: 20,
            },
            dy: {
              scale: 'x',
              band: 'true',
              mult: '-0.5',
            },
            fill: {
              value: 'black',
            },
            align: {
              value: 'left',
            },
            baseline: {
              value: 'middle',
            },
            text: (visualisation.spec.datasetNameColumnX !== null || hasAggregation) ?
              {
                template: hasAggregation ? '{{datum.aggregationValue}}' : '{{datum.label}}',
              }
              :
              {
                value: '',
              },
            angle: {
              value: 90,
            },
          },
        },
      },
      {
        type: 'text',
        properties: {
          enter: {
            align: {
              value: 'center',
            },
            fill: {
              value: 'black',
            },
          },
          update: {
            x: {
              scale: 'x',
              signal: `tooltip.${fieldX}`,
            },
            dx: {
              scale: 'x',
              band: true,
              mult: 0.5,
            },
            y: {
              scale: 'y',
              signal: `tooltip.${fieldY}`,
              offset: -5,
            },
            text: {
              signal: 'tooltipText',
            },
            fillOpacity: [
              {
                test: '!tooltip._id',
                value: 0,
              },
              {
                value: 1,
              },
            ],
          },
        },
      },
    ],
    signals: [
      {
        name: 'tooltip',
        init: {},
        streams: [
          {
            type: 'rect:mouseover',
            expr: 'datum',
          },
          {
            type: 'rect:mouseout',
            expr: '{}',
          },
        ],
      },
      {
        name: 'tooltipText',
        init: {},
        streams: [
          {
            type: 'rect:mouseover',
            expr: hasAggregation ?
              // Round aggregation metrics to 3 decimal places for tooltip
              `floor(datum.${transformType}_y * 1000) / 1000`
              :
              'datum.y'
            ,
          },
          {
            type: 'rect:mouseout',
            expr: '{}',
          },
        ],
      },
    ],
  };

  if (spec.colorColumn !== null) {
    out.scales.push({
        "name": "color",
        "type": "linear",
        "domain": {"data": dataSource,"field": fieldC},
        "range": ["#AFC6A3","#09622A"],
        "nice": false,
        "zero": false
    });

    out.marks[0].properties.update.fill = {
      scale: "color",
      field: fieldC,
    }

    if (!out.legends) out.legends = [];

    out.legends.push(
      {
        "fill": "color",
        "title": spec.colorTitle,
        "format": "s",
        "properties": {
          "symbols": {
            "shape": {"value": "circle"},
            "strokeWidth": {"value": 0},
            "opacity": {"value": 0.7}
          }
        }
      }
    );

    out.padding.right = out.padding.right + 150;
  }

  return out;
}
