import * as React from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Container from "@mui/material/Container";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Menu, MenuItem } from "@mui/material";
import { logMeOut } from "../../helpers";

const NavBar = ({ user, removeToken, groupName, isChatSelectionNavigationDisabled, accessToken, usebigLogo }) => {
  const [anchorUser, setAnchorUser] = React.useState(null);
  const navigate = useNavigate();

  const settings = [{ text: "Logout", onClick: () => logMeOut(accessToken, removeToken) }];

  const handleOpenUserMenu = (event) => {
    setAnchorUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorUser(null);
  };

  const handleLogoClick = () => {
    if (!isChatSelectionNavigationDisabled) {
      navigate("/");
    }
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#F2F2F2" }}>
      <Container maxWidth="false">
        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
          {/* Left Logo */}
          {!usebigLogo && (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                onClick={handleLogoClick}
                sx={{
                  p: 0,
                  marginLeft: { xs: "0", sm: "0", md: "15px", lg: "15px", xl: "15px" },
                }}
                disabled={isChatSelectionNavigationDisabled}
                aria-label="AI Coach Logo - Home"
              >
                <img
                  src={`${process.env.PUBLIC_URL}/thomas_logo.png`}
                  alt="AI Coach Logo"
                  style={{
                    width: "148px",
                    height: "31px",
                    marginRight: "1rem",
                  }}
                />
              </IconButton>
            </Box>
          )}
          {/* Center Group Name with responsive font size */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: "700",
                letterSpacing: { xs: ".15rem", sm: ".18rem", md: ".2rem" },
                color: "#303030",
                textDecoration: "none",
                fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.4rem" },
              }}
            >
              {groupName}
            </Typography>
          </Box>

          {/* Right Avatar */}
          <Box sx={{ flexGrow: 0, padding: "0 5px 0 55px;" }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={user.name} src="/static/images/avatar/2.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting.text} onClick={handleCloseUserMenu}>
                  <Typography textAlign="center" onClick={setting.onClick}>
                    {setting.text}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
      {usebigLogo && (
        <Box display="flex" justifyContent="center">
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton onClick={handleLogoClick} sx={{ p: 0 }} disabled={isChatSelectionNavigationDisabled}>
              <img
                src={`${process.env.PUBLIC_URL}/thomas_logo.png`}
                alt="AI Coach Logo"
                style={{ width: "345px", height: "73px" }}
              />
            </IconButton>
          </Box>
        </Box>
      )}
    </AppBar>
  );
};

export default NavBar;
