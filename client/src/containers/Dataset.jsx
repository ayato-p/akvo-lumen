import React, { Component, PropTypes } from 'react';
import Immutable from 'immutable';
import { connect } from 'react-redux';
import { showModal } from '../actions/activeModal';
import { fetchDataset } from '../actions/dataset';
import { getId, getTitle } from '../domain/entity';
import { getTransformations, getRows, getColumns } from '../domain/dataset';
import * as api from '../api';

require('../styles/Dataset.scss');

class Dataset extends Component {

  constructor() {
    super();
    this.state = {
      asyncComponents: null,
      // Pending transformations are represented as
      // an oredered map from timestamp to transformation
      pendingTransformations: Immutable.OrderedMap(),
    };
    this.handleShowDatasetSettings = this.handleShowDatasetSettings.bind(this);
    this.transform = this.transform.bind(this);
    this.undo = this.undo.bind(this);
  }

  componentDidMount() {
    const { params, dataset, dispatch } = this.props;
    const { datasetId } = params;

    if (dataset == null || dataset.get('rows') == null) {
      dispatch(fetchDataset(datasetId));
    }

    require.ensure([], () => {
      /* eslint-disable global-require */
      const DatasetHeader = require('../components/dataset/DatasetHeader').default;
      const DatasetTable = require('../components/dataset/DatasetTable').default;
      /* eslint-enable global-require */

      this.setState({
        asyncComponents: {
          DatasetHeader,
          DatasetTable,
        },
      });
    }, 'Dataset');
  }
  setPendingTransformation(timestamp, transformation) {
    const { pendingTransformations } = this.state;
    this.setState({
      pendingTransformations: pendingTransformations.set(timestamp, transformation),
    });
  }

  setPendingUndo(timestamp) {
    const { pendingTransformations } = this.state;
    this.setState({
      pendingTransformations: pendingTransformations.set(timestamp, Immutable.Map({ op: 'undo' })),
    });
  }

  removePending(timestamp) {
    const { pendingTransformations } = this.state;
    this.setState({ pendingTransformations: pendingTransformations.delete(timestamp) });
  }

  transform(transformation) {
    const { dataset, dispatch } = this.props;
    const id = dataset.get('id');
    const now = Date.now();

    this.setPendingTransformation(now, transformation);
    api.post(`/api/transformations/${id}/transform`, transformation.toJS())
      .then(() => dispatch(fetchDataset(id)))
      .then(() => this.removePending(now));
  }

  undo() {
    const { dataset, dispatch } = this.props;
    const id = dataset.get('id');
    const now = Date.now();

    this.setPendingUndo(now);
    api.post(`/api/transformations/${id}/undo`)
      .then(() => dispatch(fetchDataset(id)))
      .then(() => this.removePending(now));
  }

  handleShowDatasetSettings() {
    this.props.dispatch(showModal('dataset-settings', {
      id: getId(this.state.dataset),
    }));
  }

  render() {
    const { pendingTransformations } = this.state;
    const { dataset } = this.props;
    if (dataset == null || !this.state.asyncComponents) {
      return <div className="Dataset">Loading...</div>;
    }
    const { DatasetHeader, DatasetTable } = this.state.asyncComponents;

    return (
      <div className="Dataset">
        <DatasetHeader
          onShowDatasetSettings={this.handleShowDatasetSettings}
          name={getTitle(dataset)}
          id={getId(dataset)}
        />
        {getRows(dataset) != null &&
          <DatasetTable
            columns={getColumns(dataset)}
            rows={getRows(dataset)}
            transformations={getTransformations(dataset)}
            pendingTransformations={pendingTransformations.valueSeq()}
            onTransform={transformation => this.transform(transformation)}
            onUndoTransformation={() => this.undo()}
          />}
      </div>
    );
  }
}

Dataset.propTypes = {
  dataset: PropTypes.object,
  params: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

// Just inject `dispatch`
export default connect((state, props) => ({
  dataset: state.library.datasets[props.params.datasetId],
}))(Dataset);
