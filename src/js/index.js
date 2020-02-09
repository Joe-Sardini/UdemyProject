import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';

import * as searchView from './views/SearchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';


/** Global state of the app
 *  - Search Object
 *  - Current recipe object
 *  - Shoping list object
 *  - Liked recipes
 */
const state = {};

//SEARCH CONTROLLER
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

        try{
        //4) search for recipes
            await state.search.getResults();
            //5) render results to the UI
            clearLoader();
            searchView.renderResults(state.search.result);
        }catch (err){
            console.log('control search error');
            clearLoader();
        }
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

//RECIPE CONTROLLER
const controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#','');
    if (id){
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Hightlighjt selected search item
        if (state.search) searchView.highlightSelected(id);

        // Create new recipe object
        state.recipe = new Recipe(id);
        try{
            // Get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            // CaLculate serving time
            state.recipe.calcTime();
            state.recipe.calcServings();
            //render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        }catch(err){
            console.log(err);
            console.log('Something went wrong!');
        }
    }
}

['hashchange','load'].forEach(event => window.addEventListener(event, controlRecipe));

//RECIPE CONTROLLER
const controlList = () => {
    //Create a new list
    if (!state.list) state.list = new List();

    //Add each ing to list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //handle delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')){
        //Delete from state
        state.list.deleteItem(id);
        //Delete from UI
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});


//LIKES CONTROLLER
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    
    //user has not yet liked current recipe
    if (!state.likes.isLiked(currentID)) {  
       //Add like to the state
       const newLike = state.likes.addLike(
           currentID,
           state.recipe.title,
           state.recipe.author,
           state.recipe.img
       );
       //Toggle the like button
       likesView.toggleLikeBtn(true);
       //Add like to UI list
       likesView.renderLike(newLike);
       //user has liked current recipe    
    }else{
       //Remove like from state
       state.likes.deleteLike(currentID);
       //Toggle the like button
       likesView.toggleLikeBtn(false);
       //Remove like to UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restore likes 
window.addEventListener('load', () => {
    state.likes = new Likes();
    
    //Restore likes
    state.likes.readStorage();

    // Toggle like mene button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    state.likes.likes.forEach(like => likesView.renderLike(like));
});

//Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')){
        if (state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    }else if (e.target.matches('.btn-increase, .btn-increase *')){
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        // Add ingredients to shopping list
        controlList();
    }else if (e.target.matches('.recipe__love, .recipe__love *')){
        //Like controller
        controlLike();
    }
});

//Handle Shopping list
