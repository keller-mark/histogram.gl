/* eslint-env node */

import { createHistogram } from './index';

describe('histogram.gl', () => {
    it('Should create a histogram', (done) => {
        createHistogram().then((data) => {
            expect(data.length).toEqual(1024);
            expect(data[0]).toEqual(99);
        });
    });
});