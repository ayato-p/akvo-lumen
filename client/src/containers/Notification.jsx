import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { hideNotification } from '../actions/notification';

require('./Notification.scss');

// When autohide is used, how long to wait in ms before hiding the notification with no user input
const autohideDelay = 3000;

class Notification extends Component {
  constructor() {
    super();
    this.state = {
      onscreen: false,
    };
  }
  componentWillMount() {
    if (this.props.autohide) {
      const { dispatch } = this.props;
      const unmount = () => dispatch(hideNotification());
      const hide = () => {
        this.setState({ onscreen: false });
        this.timeout = setTimeout(unmount, 500);
      };

      this.timeout = setTimeout(hide, autohideDelay);
    }
  }
  componentDidMount() {
    // Force one additional render so we can change the className and animate position with css.
    //  Lint exception is OK here - it's designed to prevent re-renders, but we want the re-render.
    //  eslint-disable-next-line react/no-did-mount-set-state
    setTimeout(() => this.setState({ onscreen: true }), 0);
  }
  componentWillUnmount() {
    clearTimeout(this.timeout);
  }
  render() {
    const { level, message, dispatch } = this.props;
    return (
      <div
        className={`Notification ${level} ${this.state.onscreen ? 'onscreen' : 'offscreen'}`}
      >
        <span
          className="message"
        >
          {message}
        </span>
        <span
          className="close clickable"
          onClick={() => dispatch(hideNotification())}
        >
          ✕
        </span>
      </div>
    );
  }
}

Notification.propTypes = {
  level: PropTypes.oneOf(['info', 'warn', 'error']).isRequired,
  message: PropTypes.string.isRequired,
  autohide: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
};

export default connect()(Notification);
