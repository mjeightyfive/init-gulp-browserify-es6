import $ from 'jquery';
import get from './data';

var url = 'http://jsonplaceholder.typicode.com/posts';

get(url, (data) => {
    $('.main').text('text: ' + data[0].body);
});
