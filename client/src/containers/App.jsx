import React from 'react';
import PropTypes from 'prop-types';
import { IndexRedirect, Redirect, Router, Route } from 'react-router';
import IntlWrapper from './IntlWrapper';
import Library from '../components/Library';
import Visualisation from './Visualisation';
import Dataset from './Dataset';
import Dashboard from './Dashboard';
import Users from '../components/Users';
import Resources from '../components/Resources';
import Main from './Main';
import WorkspaceNav from '../components/WorkspaceNav';
import AdminNav from '../components/AdminNav';
import AkvoMapsDemo from '../components/demo/AkvoMapsDemo';

export default function App({ history, location }) {
  return (
    <IntlWrapper>
      <Router history={history}>
        <Route path="/" component={Main}>
          <IndexRedirect from="" to="library" />
          <Route
            path="library"
            components={{ sidebar: WorkspaceNav, content: Library }}
            location={location}
          />
          <Route
            path="library/collections/:collectionId"
            components={{ sidebar: WorkspaceNav, content: Library }}
            location={location}
          />
          <Route
            path="dataset/:datasetId"
            components={{ sidebar: WorkspaceNav, content: Dataset }}
            location={location}
          />
          <Route
            path="visualisation/demo/akvo-maps"
            components={{ sidebar: WorkspaceNav, content: AkvoMapsDemo }}
            location={location}
          />
          <Route
            path="visualisation/create"
            components={{ sidebar: WorkspaceNav, content: Visualisation }}
            location={location}
          />
          <Route
            path="visualisation/:visualisationId"
            components={{ sidebar: WorkspaceNav, content: Visualisation }}
            location={location}
          />
          <Route
            path="dashboard/create"
            components={{ sidebar: WorkspaceNav, content: Dashboard }}
            location={location}
          />
          <Route
            path="dashboard/:dashboardId"
            components={{ sidebar: WorkspaceNav, content: Dashboard }}
            location={location}
          />
          <Redirect from="admin" to="/admin/users" />
          <Route
            path="admin/users"
            components={{ sidebar: AdminNav, content: Users }}
            location={location}
          />
          <Route
            path="admin/resources"
            components={{ sidebar: AdminNav, content: Resources }}
            location={location}
          />
        </Route>
      </Router>
    </IntlWrapper>
  );
}

App.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object,
};
