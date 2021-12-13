import React from 'react';
import './MenuManagement.css';
import { ReactComponent as Drop } from '../assets/expand-dropDown.svg';
class CustomSelect extends React.Component {
  constructor(props) {
    super(props);

    // @defaultSelectText => Show default text in select
    // @showOptionList => Show / Hide List options
    // @optionsList => List of options
    this.state = {
      showOptionList: false,
      optionsList: [],
    };
  }

  componentDidMount() {
    // Add Event Listner to handle the click that happens outside
    // the Custom Select Container
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    // Remove the event listner on component unmounting

    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  // This method handles the click that happens outside the
  // select text and list area
  handleClickOutside = (e) => {
    if (
      !e.target.classList.contains('custom-select-option') &&
      !e.target.classList.contains('selected-text')
    ) {
      this.setState({
        showOptionList: false,
      });
    }
  };

  // This method handles the display of option list
  handleListDisplay = () => {
    this.setState((prevState) => {
      return {
        showOptionList: !prevState.showOptionList,
      };
    });
  };

  // This method handles the setting of name in select text area
  // and list display on selection
  handleOptionClick = (e, id, warehouse) => {
    this.props.changeSelect(id);
  };

  render() {
    const { optionsList } = this.props;
    const { showOptionList } = this.state;

    return (
      <div className="custom-select-container" style={this.props.style}>
        <div
          className={showOptionList ? 'selected-text active' : 'selected-text'}
          onClick={this.handleListDisplay}
        >
          {this.props.selectedName}
          <span style={{ marginLeft: '11px' }}>
            {this.props.imageColor === 'true' ? (
              <Drop
                className="drop-down-icon"
                style={{
                  top: '0px',
                  left: '0px',
                  position: 'relative',
                  width: '15px',
                  transform: this.state.showOptionList
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)',
                }}
              />
            ) : (
              <img
                src="../../../assets/black.png"
                style={{
                  top: '0px',
                  left: '0px',
                  position: 'relative',
                  transform: this.state.showOptionList
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)',
                }}
                alt="black"
              />
            )}
          </span>
        </div>

        {showOptionList && (
          <ul className="select-options">
            {optionsList.map((option) => {
              return (
                <li
                  className="custom-select-option"
                  data-name={option.category_name}
                  key={option.id}
                  onClick={(e) =>
                    this.handleOptionClick(e, option.id, option.warehouse)
                  }
                >
                  {option.category_name}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
}

export default CustomSelect;
