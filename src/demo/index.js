import { createHistogram } from '../index';
import './index.scss';

createHistogram().then((data) => {
    console.log(data);

    const pre = document.createElement("pre");
    pre.innerHTML = data;
    document.querySelector("#root").appendChild(pre);
});

