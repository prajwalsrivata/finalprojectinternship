import { StoreContext } from "./StoreContext.jsx"
import { food_list } from "../../assets/assets"

const StoreContextProvider = (props) => {
    const contextValue = {
        food_list
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider
