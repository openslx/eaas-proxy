/**
 * Implements the "Resource Owner Password Credentials Grant" flow
 * (<https://tools.ietf.org/html/rfc6749#section-4.3>).
 * @param {string} token_endpoint Iss(uer) URL used for auto-discovery of token_endpoint,
 * see https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationRequest
 * @param {string} client_id ID assigned to the target application,
 * might be equal to aud(ience)
 */
export const getTokenUsingResourceOwnerPassword = async ({
    issuer,
    username,
    password,
    client_id,
    scope = "openid",
}) => {
    const { token_endpoint } = await (await fetch(
        `${issuer}/.well-known/openid-configuration`
    )).json();

    const body = new URLSearchParams({
        grant_type: "password",
        username,
        password,
        scope,
    }).toString();
    // (At least) Keycloak requires the client_id to be sent
    // (without a password) even for this flow type.
    const authorization = `Basic ${btoa(`${client_id}:`)}`;
    const res = await fetch(token_endpoint, {
        method: "POST",
        body,
        headers: {
            authorization,
            "content-type": "application/x-www-form-urlencoded",
        },
    });
    const json = await res.json();
    return json;
};
