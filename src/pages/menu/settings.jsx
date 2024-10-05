import React, { Component } from "react";
import { Block, List, ListItem, Toggle } from "framework7-react";
import { withTranslation } from "react-i18next";

import storeService from "../../services/store-service";

const defaulDataSetting = {
  auto_connect: true,
};

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSetting: defaulDataSetting,
    };
    this.settingService = new storeService(`setting`);
  }

  componentDidMount = () => {
    let dataSetting = this.settingService.recent();
    if (dataSetting) {
      this.setState({ dataSetting });
    }
  };

  onChangeToogle = (type) => {
    const dataSetting = {
      ...this.state.dataSetting,
      [type]: !this.state.dataSetting[type],
      id: "setting",
    };
    this.settingService.updateOrCreate(dataSetting);

    this.setState({
      dataSetting,
    });
  };

  render() {
    const { dataSetting } = this.state;

    return (
      <Block>
        <List>
          <ListItem key="auto-connect" title={t("page.automatic_connection")}>
            <Toggle checked={dataSetting.auto_connect} onChange={() => this.onChangeToogle("auto_connect")} />
          </ListItem>
        </List>
      </Block>
    );
  }
}
export default withTranslation()(Settings);
