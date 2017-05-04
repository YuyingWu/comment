import {render} from "react-dom";
import React from "react";
import {Provider} from "react-redux";

// import App from "./containers/App";
import Comment from "./containers/Comment";
import store from "./store";

render(
    <Provider store={store}>
        <Comment />
    </Provider>,
    window.document.getElementById('app'));