export default function getVegaScatterSpec(visualisation, data, containerHeight, containerWidth) {
  const spec = visualisation.spec;
  const hasAggregation = Boolean(visualisation.spec.datasetGroupColumnX &&
    visualisation.spec.aggregationTypeY);
  const dataArray = data.map(item => item);
  const transformType = hasAggregation ? visualisation.spec.aggregationTypeY : null;

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
            x: [
              transformType,
            ],
          },
        },
      ],
    };

    dataArray.push(transform1);
  }

  const dataSource = hasAggregation ? 'summary' : 'table';
  const fieldX = hasAggregation ? `${transformType}_x` : 'x';
  const fieldY = hasAggregation ? `${transformType}_y` : 'y';
  const fieldC = hasAggregation ? `${transformType}_colorValue` : 'colorValue';

  const scales = [
    {
      name: 'xscale',
      type: 'linear',
      domain: {
        data: dataSource,
        field: fieldX,
      },
      range: 'width',
      zero: false,
      nice: false,
    },
    {
      name: 'yscale',
      type: 'linear',
      domain: {
        data: dataSource,
        field: fieldY,
      },
      range: 'height',
      nice: true,
    },
  ];

  if (visualisation.spec.datasetColumnXType === 'date') {
    scales.push({
      name: 'dateScale',
      type: 'linear',
      domain: {
        data: dataSource,
        field: 'dateLabelX',
      },
      range: 'width',
      zero: false,
      nice: false,
    });
  }

  const xAxis = {
    type: 'x',
    scale: 'xscale',
    orient: 'bottom',
    title: visualisation.spec.labelX,
  };

  if (visualisation.spec.datasetColumnXType === 'date') {
    xAxis.properties = {
      labels: {
        text: {
          template: '{{ datum.data | time:"%Y-%b-%d %H-%M"}}',
        },
        angle: {
          value: 35,
        },
        align: {
          value: 'left',
        },
      },
    };
  }

  const out = {
    data: dataArray,
    width: containerWidth - 90,
    height: containerHeight - 100,
    padding: {
      top: 30,
      left: 60,
      bottom: 70,
      right: 30,
    },
    scales,
    axes: [
      xAxis,
      {
        type: 'y',
        scale: 'yscale',
        orient: 'left',
        title: visualisation.spec.labelY,
      },
    ],
    marks: [
      {
        type: 'symbol',
        from: {
          data: dataSource,
        },
        properties: {
          enter: {
            x: {
              field: fieldX,
              scale: 'xscale',
            },
            y: {
              field: fieldY,
              scale: 'yscale',
            },
            size: { value: 50 },
            opacity: { value: 0.8 },
          },
          update: {
            fill: { value: 'rgb(149, 150, 184)' },
            opacity: [
              {
                test: 'hover._id && hover._id !== datum._id',
                value: 0.2,
              },
              {
                value: 0.8,
              },
            ],
          },
          hover: {
            fill: { value: 'rgb(43, 182, 115)' },
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
              test: 'datum._id == hover._id',
            },
          ],
        },
        properties: {
          update: {
            fill: {
              value: 'black',
            },
            x: {
              field: fieldX,
              scale: 'xscale',
            },
            y: {
              field: fieldY,
              scale: 'yscale',
              offset: -8,
            },
            text: hasAggregation ?
            {
              template: visualisation.spec.datasetGroupColumnXType === 'date' ?
                  '{{datum.aggregationValue | time:"%Y-%b-%d %H-%M"}}'
                  :
                  '{{datum.aggregationValue}}'
                ,
            }
              :
            {
              template: visualisation.spec.datasetNameColumnXType === 'date' ?
                  '{{datum.label | time:"%Y-%b-%d %H-%M"}}'
                  :
                  '{{datum.label}}'
                ,
            },
            align: {
              value: 'center',
            },
          },
        },
      },
    ],
    signals: [
      {
        name: 'hover',
        init: '{}',
        streams: [
          {
            type: 'symbol:mouseover',
            expr: 'datum',
          },
          {
            type: 'symbol:mouseout',
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

  if (spec.sizeColumn !== null) {
    out.scales.push({
      name: 'size',
      type: 'linear',
      domain: { data: dataSource, field: 'sizeValue' },
      range: [5, 200],
      nice: false,
      zero: false,
    });

    out.legends.push(
      {
        size: 'size',
        title: spec.sizeTitle || 'legend',
        format: 's',
        properties: {
          symbols: {
            shape: { value: 'circle' },
            strokeWidth: { value: 2 },
            opacity: { value: 0.7 },
          },
        },
      }
    );

    out.marks[0].type = 'symbol';
    delete out.marks[0].properties.update.width;
    delete out.marks[0].properties.update.height;

    out.marks[0].properties.shape = { value: 'circle' };
    out.marks[0].properties.strokeWidth = { value: 2 };
    out.marks[0].properties.update.size = {
      scale: 'size',
      field: 'sizeValue',
    };
  }

  return out;
}
