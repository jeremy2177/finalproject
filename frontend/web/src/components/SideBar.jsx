import { NavLink, useNavigate } from "react-router-dom";


function SideBar(){
    return(
        <div className="sidebar">
            <h2>acacia trades</h2>
            <ul>
                <li><NavLink to="/">Dashboard</NavLink></li>
                <li><NavLink to="/positions">Positions</NavLink></li>
                <li><NavLink to="/add-position">Add Position</NavLink></li>
                <li><NavLink to="/statistics">Statistics</NavLink></li>
            </ul>
        </div>
    )
}

export default SideBar;