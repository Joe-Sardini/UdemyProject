import Search from './models/Search';
import * as searchView from './views/searchView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of the app
 *  - Search Object
 *  - Current recipe object
 *  - Shoping list object
 *  - Liked recipes
 */
const state = {};

const controlSearch = async () => {
    //1) get query from view
    const query = searchView.getInput(); 

    if (query){
        //2) New search object and add to state
        state.search = new Search(query);

        //3) prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchResults);

        //4) search for recipes
        await state.search.getResults();

        //5) render results to the UI
        clearLoader();
        searchView.renderResults(state.search.result);
    }
}

elements.searchField.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});