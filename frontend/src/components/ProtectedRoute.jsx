import {useEffect,useState} from "react";

import axios from "axios";

import {Navigate} from "react-router-dom";

function ProtectedRoute({children}) {

  const [
    loading,
    setLoading
  ] =
  useState(
    true
  );

  const [
    authenticated,
    setAuthenticated
  ] =
  useState(
    false
  );

  async function checkUser() {

    try {

      await axios.get(
        "/api/me/",
        {
          withCredentials: true
        }
      );

      setAuthenticated(
        true
      );

    }

    catch {

      setAuthenticated(
        false
      );

    }

    setLoading(
      false
    );

  }

  useEffect(
    () => {

      checkUser();

    },
    []
  );

  if (
    loading
  ) {

    return (
      <h2>
        Loading...
      </h2>
    );

  }

  if (
    !authenticated
  ) {

    return (
      <Navigate
        to="/login"
      />
    );

  }

  return children;

}

export default ProtectedRoute;