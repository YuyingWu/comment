const commentReducer = (state = {
    list: [],
    displayList: [],
    selected: []
}, action) => {
    switch (action.type) {
        case "INIT_LIST_FULFILLED":
            state = {
                ...state,
                list: [...action.payload],
                displayList: [...action.payload]
            };
            break;
        case "SELECT_COMMENT":
            state = {
                ...state,
                selected: [...action.payload]
            };
            break;
        case "UPDATE_DISPLAY":
            state = {
                ...state,
                displayList: [...action.payload]
            };
            break;
        case "DEL_COMMENT_FULFILLED":
            state = {
                ...state,
                list: [...state.list.filter(item => item.id != action.payload)],
                displayList: [...state.displayList.filter(item => item.id != action.payload)]
            };
            break;
        case "UPDATE_COMMENT_FULFILLED":
            const { id, key, value } = action.payload;
            let displayList = [...state.displayList];
            let list = [...state.list];
            const currentIndex = state.list.findIndex(item => item.id == id);
            const currentDisplayIndex = state.displayList.findIndex(item => item.id == id);
            let current = state.list.find(item => item.id == id);
            
            // 更新名值对
            current[key] = value;

            // 更新对应项
            list[currentIndex] = current;
            displayList[currentDisplayIndex] = current;

            state = {
                ...state,
                list: [...list],
                displayList: [...displayList]
            };
            break;
    }
    return state;
};

export default commentReducer;