var tdapi = tdapi || {};
tdapi.dandd = tdapi.dandd || {};
(function(context) {
    var dragItems,
            dragSrcEl;

    function cancel(event) {
            event.preventDefault();
        return false;
    }

    context.init = function() {
        dragItems = $('.track').each(function() {
            $(this).on('dragstart', function(e) {
                dragSrcEl = this;
                e.originalEvent.dataTransfer.setData('text', this.innerHTML);
            });
        });
    };
    context.handleCancel = function(e) {
        cancel(e);
    };

    context.handleDrop = function(e) {
            e.preventDefault();
        if (dragSrcEl !== this) {
            dragSrcEl.innerHTML = this.innerHTML;
            this.innerHTML = e.originalEvent.dataTransfer.getData('text');
        }
        var seqIds = [];
        $(".track").find("span").each(function(){ seqIds.push(parseInt(this.id - 1)); });
        tdapi.lastfm.handleSortTrackList(seqIds);
        return false;
    };
})(tdapi.dandd);

