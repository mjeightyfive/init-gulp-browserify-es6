import $ from 'jquery';

export default function get(url, callback) {
    $.ajax({
        url: url,
        success: function(data) {
            callback(data);
        },
        error: function() {
            console.log('fail!');
        }
    });
}
