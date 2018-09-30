function Page() {
	this.shapes = []; //main array used for rendering
    this.command_history = []; //allow undo
    this.undo_history = []; //allow redo
    this.pending_commands = []; //Client-prediction of shapes until authoritative server responds
    this.inbetween_commands = [];

    this.pending_clear = false;
    this.pending_undo = []; // We use a list because on a laggy connection, there could conceivably be multiple pending undos waiting for resolution

    this.get_all = function() {
    	return [this.shapes, this.command_history, this.undo_history, this.pending_commands, this.inbetween_commands, this.pending_clear, this.pending_undo];
    }



}


function PageManager() {
	this.curr_page_display = document.getElementById('current-page-indicator');
	this.max_page_display = document.getElementById('max-page-indicator');


	this.pages = [new Page()];
	this.curr_page = 0; // Index of current page in this.pages

	this.add_page = function(){
		this.pages.push(new Page());

		this.max_page_display.innerHTML = this.pages.length;

	}

	this.get_current_page = function() {
		return this.pages[this.curr_page];
	}

	this.set_page = function(page) {
		if (page == this.pages.length) this.add_page(); // page number was one too high -- assume they want to create a new page

		if (page < this.pages.length && page >= 0) this.curr_page = page; // set curr_page AFTER we've already tried to add a new page
		else throw "Invalid Page Number" // If the page was more than one too high, or negative, either foul-play or a bug must be at work.  Throw an error.

		this.curr_page_display.value = this.curr_page + 1; // + 1 because arrays start at 0, but our display starts at 1.  <insert generic 'arrays start at 1' joke here>

		return this.get_current_page().get_all();
	}


}