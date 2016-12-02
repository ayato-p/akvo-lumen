export default function getVegaAreaSpec(visualisation, data, containerHeight, containerWidth) {
  const { visualisationType } = visualisation;
  const hasAggregation = visualisation.spec.datasetGroupColumnX !== null;
  const hasSort = visualisation.spec.datasetSortColumnX !== null;
  const dataArray = data.map(item => item);
  const transformType = hasAggregation ? visualisation.spec.aggregationTypeY : null;
  const xIsDate = visualisation.spec.datasetColumnXType === 'date';

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
          },
        },
      ],
    };
    dataArray.push(transform1);
  }

  const dataSource = hasAggregation ? 'summary' : 'table';
  const xAggTrue = hasSort ? `${transformType}_sortValue` : 'aggregationValue';
  const xAggFalse = 'x';
  // const fieldX = hasAggregation ? xAggTrue : xAggFalse;
  // const fieldY = hasAggregation ? `${transformType}_y` : 'y';
  const fieldX = 'x';
  const fieldY = 'y';

  console.log(data);

  return ({
    data: dataArray,
    height: containerHeight - 120,
    width: containerWidth - 70,
    padding: {
      top: 30,
      right: 20,
      bottom: 90,
      left: 50,
    },
    scales: [
      {
        name: 'x',
        type: 'linear',
        range: 'width',
        zero: false,
        domain: {
          data: dataSource,
          field: fieldX,
        },
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        nice: true,
        domain: {
          data: dataSource,
          field: fieldY,
        },
      },
    ],
    axes: [
      {
        type: 'x',
        scale: 'x',
        title: visualisation.spec.labelX,
        properties: {
          labels: {
            text: {
              template: xIsDate ? '{{datum.data|time:"%Y-%m-%d"}}' : '{{datum.data}}',
            },
            angle: {
              value: 25,
            },
            align: {
              value: 'left',
            },
          },
        },
      },
      {
        type: 'y',
        scale: 'y',
        title: visualisation.spec.labelY,
      },
    ],
    marks: [
      visualisationType === 'area' ?
        {
          type: 'area',
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
                field: fieldY,
              },
              y2: {
                scale: 'y',
                value: 0,
              },
              fill: {
                value: 'rgb(149, 150, 184)',
              },
            },
          },
        }
        :
        {
          type: 'line',
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
                field: fieldY,
              },
              y2: {
                scale: 'y',
                value: 0,
              },
              stroke: {
                value: 'rgb(149, 150, 184)',
              },
            },
          },
        },
    ],
  });
}
