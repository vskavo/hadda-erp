# Auth Module

## Description

The Auth module is responsible for user authentication, authorization, and session management. It handles user registration, login, logout, password recovery, and role-based access control.

## Funcionalidad

- **User Registration:** Allows new users to register in the application.
- **User Login:** Authenticates users based on their email and password.
- **User Logout:** Closes the user's session.
- **Password Recovery:** Allows users to reset their password through a token-based system.
- **Role Management:** Provides CRUD operations for roles and permissions.
- **Permission Management:** Provides CRUD operations for permissions.
- **Token-based Authentication:** Uses JSON Web Tokens (JWT) for session management.

## Relación con otros módulos

- **Users Module:** The Auth module is tightly coupled with the Users module, as it authenticates and authorizes users. The `Usuario` model is used to store user information, including their role.
- **All other modules:** The Auth module is used to protect routes and resources in all other modules. The `auth` middleware is used to verify that a user is authenticated and has the necessary permissions to access a resource.
