export default function getVegaPieSpec(visualisation, data, containerHeight, containerWidth) {
  const spec = visualisation.spec;
  const chartRadius = containerHeight < containerWidth ? containerHeight / 3 : containerWidth / 3;
  const innerRadius = visualisation.visualisationType === 'donut' ?
    Math.floor(chartRadius / 1.75) : 0;

  /* const hasAggregation = Boolean(visualisation.spec.datasetGroupColumnX &&
    visualisation.spec.aggregationTypeY); */
  const hasAggregation = true;
  const dataArray = data.map(item => item);
  const transformType = 'count';

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
            colorValue: [
              spec.colorAggregationType,
            ],
          },
        },
      ],
    };
    const transform2 = {
      name: 'pie',
      source: 'summary',
      transform: [
        {
          type: 'pie',
          field: `${transformType}_y`,
        },
        {
          type: 'formula',
          field: 'rounded_value',
          expr: `floor(datum.${transformType}_y * 1000) / 1000`, // round label to 3 decimal places
        },
        {
          type: 'formula',
          field: 'percentage',
          expr: '((datum.layout_end - datum.layout_start) / (2 * PI)) * 100',
        },
        {
          type: 'formula',
          field: 'rounded_percentage',
          // round percentage to 2 decimal places for labels
          expr: 'floor(datum.percentage * 100) / 100',
        },

      ],
    };

    dataArray.push(transform1, transform2);
  } else {
    const pieData = Object.assign({}, data);

    pieData.transform = [{
      type: 'pie',
      field: 'y',
      sort: 'true',
    }];

    dataArray.push(pieData);
  }

  const dataSource = hasAggregation ? 'pie' : 'table';
  const segmentLabelField = hasAggregation ? 'aggregationValue' : 'label';
  const fieldY = hasAggregation ? `${transformType}_y` : 'y';
  const fieldC = hasAggregation ? `${spec.colorAggregationType}_colorValue` : 'colorValue';

  const out = {
    data: dataArray,
    width: containerWidth - 20,
    height: containerHeight - 45,
    padding: {
      top: 35,
      right: 10,
      bottom: 10,
      left: 10,
    },
    scales: [
      {
        name: 'r',
        type: 'ordinal',
        domain: {
          data: dataSource,
          field: fieldY,
        },
        range: [chartRadius],
      },
      {
        name: 'c',
        type: 'ordinal',
        range: 'category10',
        domain: {
          data: dataSource,
          field: fieldY,
        },
      },
    ],
    marks: [
      {
        type: 'arc',
        from: {
          data: dataSource,
        },
        properties: {
          enter: {
            x: {
              field: {
                group: 'width',
              },
              mult: 0.5,
            },
            y: {
              field: {
                group: 'height',
              },
              mult: 0.5,
            },
            startAngle: {
              field: 'layout_start',
            },
            endAngle: {
              field: 'layout_end',
            },
            innerRadius: {
              value: innerRadius,
            },
            outerRadius: {
              value: chartRadius,
            },
            stroke: {
              value: 'white',
            },
          },
          update: {
            fill: {
              scale: 'c',
              field: fieldY,
            },
          },
          hover: {
            fill: {
              value: 'pink',
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
              field: {
                group: 'width',
              },
              mult: 0.5,
            },
            y: {
              field: {
                group: 'height',
              },
              mult: 0.5,
            },
            radius: {
              scale: 'r',
              field: 'value',
              offset: 30,
            },
            theta: {
              field: 'layout_mid',
            },
            fill: {
              value: 'black',
            },
            align: {
              value: 'center',
            },
            text: {
              field: segmentLabelField,
            },
          },
        },
      },
      {
        type: 'text',
        from: {
          data: dataSource,
          transform: [
            {
              type: 'filter',
              test: 'datum._id == tooltip._id || datum._id == textTooltip._id',
            },
          ],
        },
        properties: {
          enter: {
            x: {
              field: {
                group: 'width',
              },
              mult: 0.5,
            },
            y: {
              field: {
                group: 'height',
              },
              mult: 0.5,
            },
            radius: {
              scale: 'r',
              field: 'a',
              offset: -1 * (chartRadius / 5),
            },
            theta: {
              field: 'layout_mid',
            },
            fill: {
              value: 'black',
            },
            align: {
              value: 'center',
            },
            text: hasAggregation ?
            {
              template: '{{datum.rounded_percentage}}% ({{datum.rounded_value}})',
            }
              :
            {
              field: fieldY,
            }
            ,
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
            type: 'arc:mouseover',
            expr: 'datum',
          },
          {
            type: 'arc:mouseout',
            expr: '{}',
          },
        ],
      },
      {
        name: 'textTooltip',
        init: {},
        streams: [
          {
            type: 'text:mouseover',
            expr: 'datum',
          },
          {
            type: 'text:mouseout',
            expr: '{}',
          },
        ],
      },
    ],
  };

  if (spec.colorColumn !== null) {
    out.scales.push({
      name: 'color',
      type: 'linear',
      domain: { data: dataSource, field: fieldC },
      range: ['#AFC6A3', '#09622A'],
      nice: false,
      zero: false,
    });

    out.marks[0].properties.update.fill = {
      scale: 'color',
      field: fieldC,
    };

    if (!out.legends) out.legends = [];

    out.legends.push(
      {
        fill: 'color',
        title: spec.colorTitle,
        format: 's',
        properties: {
          symbols: {
            shape: { value: 'circle' },
            strokeWidth: { value: 0 },
            opacity: { value: 0.7 },
          },
        },
      }
    );

    out.padding.right = out.padding.right + 150;
  }

  return out;
}
