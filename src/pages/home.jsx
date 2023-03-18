import React from "react";
import { Page, Navbar, NavTitleLarge, Block, BlockTitle } from "framework7-react";

const HomePage = () => (
  <Page name="home">
    {/* Top Navbar */}
    <Navbar large sliding={false}>
      <NavTitleLarge>EDL App</NavTitleLarge>
    </Navbar>
    {/* Page content */}
    <Block strong>
      <p>Here is your blank Framework7 app. Let's see what we have here.</p>
    </Block>
    <BlockTitle>Navigation</BlockTitle>
  </Page>
);
export default HomePage;
