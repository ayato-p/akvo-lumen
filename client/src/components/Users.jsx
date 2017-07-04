import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import EntityTypeHeader from './entity-editor/EntityTypeHeader';
import ConfirmUserAction from './users/ConfirmUserAction';
import InviteUser from './users/InviteUser';
import * as api from '../api';

require('./entity-editor/EntityTypeHeader.scss');
require('./Users.scss');

function UserActionSelector({ getUserActions, onChange, user }) {
  const actions = getUserActions(user);
  return (
    <select
      className="UserActionSelector"
      onChange={event => onChange(user, event.target.value)}
      value="?"
    >
      <option value="?">...</option>
      {actions.map(([value, text, disabled]) => (
        <option disabled={disabled} key={value} value={value}>{text}</option>
      ))}
    </select>
  );
}

UserActionSelector.propTypes = {
  getUserActions: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  user: PropTypes.shape({
    active: PropTypes.bool.isRequired,
    admin: PropTypes.bool,
    email: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    username: PropTypes.string,
  }),
};

UserActionSelector.defaultProps = {
  user: {
    admin: false,
    username: '',
  },
};

function User({ getUserActions, invitationMode, onChange, user }) {
  const { active, admin, email, username } = user;
  return (
    <tr>
      {!invitationMode &&
        <td>
          {username}
          {active && <span className="isMe"> (me)</span>}
        </td>
      }
      <td>{email}</td>
      {!invitationMode && <td>{admin ? 'Admin' : 'User'}</td>}
      <td>
        <UserActionSelector
          getUserActions={getUserActions}
          onChange={onChange}
          user={user}
        />
      </td>
    </tr>
  );
}

User.propTypes = {
  getUserActions: PropTypes.func.isRequired,
  invitationMode: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  user: PropTypes.shape({
    active: PropTypes.bool.isRequired,
    admin: PropTypes.bool,
    email: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    username: PropTypes.string,
  }).isRequired,
};

User.defaultProps = {
  user: {
    admin: false,
    username: '',
  },
};

function UserList({ activeUserId, getUserActions, invitationMode, onChange, users }) {
  return (
    <table>
      <tbody>
        <tr>
          {!invitationMode && <th>Name</th>}
          <th>Email</th>
          {!invitationMode && <th>Role</th>}
          <th>Actions</th>
        </tr>
        {users.map(({ admin, email, id, username }) => (
          <User
            getUserActions={getUserActions}
            key={id}
            onChange={onChange}
            invitationMode={invitationMode}
            user={{
              active: id === activeUserId,
              admin,
              email,
              id,
              username }}
          />
        ))}
      </tbody>
    </table>
  );
}

UserList.propTypes = {
  activeUserId: PropTypes.string.isRequired,
  getUserActions: PropTypes.func.isRequired,
  invitationMode: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  users: PropTypes.array.isRequired,
};

class Users extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userAction: {
        action: '',
        user: { email: '', id: '', username: '' },
      },
      invitationMode: false,
      invitations: [],
      isActionModalVisible: false,
      isInviteModalVisible: false,
      users: [],
    };
    this.getUserActions = this.getUserActions.bind(this);
    this.getUserActionButtons = this.getUserActionButtons.bind(this);
    this.getInvitations = this.getInvitations.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.handleUserAction = this.handleUserAction.bind(this);
    this.handleUserActionSelect = this.handleUserActionSelect.bind(this);
    this.onInviteUser = this.onInviteUser.bind(this);
  }

  componentDidMount() {
    if (this.props.profile.admin) {
      this.getInvitations();
      this.getUsers();
    }
  }

  onInviteUser(email) {
    this.setState({ isInviteModalVisible: false });
    api.post('/api/admin/invites', { email })
      .then(response => response.json())
      .then(() => this.getInvitations());
  }

  getUsers() {
    api.get('/api/admin/users')
      .then(response => response.json())
      .then(({ users }) => this.setState({ users }));
  }

  getInvitations() {
    api.get('/api/admin/invites')
      .then(response => response.json())
      .then(({ invites }) => this.setState({ invitations: invites }));
  }

  getUserActionButtons() {
    const invitationMode = this.state.invitationMode;
    const buttons = [
      {
        buttonText: invitationMode ? 'Manage users' : 'Manage invitations',
        onClick: () => this.setState({ invitationMode: !invitationMode }),
      },
      {
        buttonText: 'Invite user',
        onClick: () => this.setState({ isInviteModalVisible: true }),
      },
    ];
    return invitationMode ? buttons : [buttons[0]];
  }

  getUserActions(user) {
    const { active, admin } = user;
    let actions = [];
    if (this.state.invitationMode) {
      actions = [['revoke', 'Revoke invitation', false]];
    } else {
      actions = [
        ['edit', 'Edit user', true],
        ['delete', 'Delete user', active],
      ];
      if (admin) {
        actions.push(['demote', 'Revoke admin privileges', (!admin || active)]);
      } else {
        actions.push(['promote', 'Enable admin privileges', admin]);
      }
    }
    return actions;
  }

  handleUserActionSelect(user, action) {
    this.setState({
      isActionModalVisible: true,
      userAction: { action, user },
    });
  }

  handleUserAction() {
    const { action, user } = this.state.userAction;
    const { id } = user;
    this.setState({ isActionModalVisible: false });
    const usersUrl = `/api/admin/users/${id}`;
    const invitesUrl = `/api/admin/invites/${id}`;
    if (action === 'delete') {
      api.del(usersUrl)
        .then(response => response.json())
        .then(() => this.getUsers());
    } else if (action === 'demote') {
      api.patch(usersUrl, { admin: false })
        .then(response => response.json())
        .then(() => this.getUsers());
    } else if (action === 'promote') {
      api.patch(usersUrl, { admin: true })
        .then(response => response.json())
        .then(() => this.getUsers());
    } else if (action === 'revoke') {
      api.del(invitesUrl)
        .then(response => response.json())
        .then(() => this.getInvitations());
    }
  }

  render() {
    const actionButtons = this.getUserActionButtons();
    const { admin, id } = this.props.profile;
    const saveStatus = '';
    const invitationMode = this.state.invitationMode;
    const title = invitationMode ? 'Invitations' : 'Members';

    if (!admin) {
      return (
        <div>
          <p>You need to be an admin user to view and invite other users.</p>
        </div>
      );
    }

    return (
      <div className="UsersContainer">
        <EntityTypeHeader
          title={title}
          saveStatus={saveStatus}
          actionButtons={actionButtons}
        />
        <div className="UserList">
          <UserList
            activeUserId={id}
            getUserActions={this.getUserActions}
            onChange={this.handleUserActionSelect}
            invitationMode={invitationMode}
            users={invitationMode ? this.state.invitations : this.state.users}
          />
        </div>
        <InviteUser
          isOpen={this.state.isInviteModalVisible}
          onClose={() => this.setState({ isInviteModalVisible: false })}
          onInviteUser={this.onInviteUser}
        />
        <ConfirmUserAction
          isOpen={this.state.isActionModalVisible}
          onChange={this.handleUserAction}
          onClose={() => this.setState({ isActionModalVisible: false })}
          userAction={this.state.userAction}
        />
      </div>
    );
  }
}

export default connect(state => ({
  profile: state.profile,
}))(Users);

Users.propTypes = {
  profile: PropTypes.shape({
    admin: PropTypes.bool,
    email: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }).isRequired,
};

Users.defaultProps = {
  profile: {
    admin: false,
    username: '',
  },
};
