import React, { Component } from "react";
import Amplify, { Auth } from "aws-amplify";
import awsconfig from "../../aws-exports";
import axios from 'axios';
import qs from 'qs'

const updateByPropertyName = (propertyName, value) => () => ({
	[propertyName]: value
});

const INITIAL_STATE = {
	email: "",
	password: "",
	error: null,
	user: null,
	tempPasswordScreen: false,
	passwordChangeSuccessMsg: false,
	newPassword: "",
	confirmPassword: "",
	passwordError: 0,
	passwordErrorCognitoMessage: ""
};

class Login extends Component {

	constructor(props) {
		Amplify.configure(awsconfig);
		super(props);

		this.state = { ...INITIAL_STATE };
	}

	changeState(type, event) {
		const { changeAuthState } = this.props;
		changeAuthState(type, event);
	}

	onSubmit = event => {
		this.setState(updateByPropertyName("passwordChangeSuccessMsg", false));
		const { email, password } = this.state;
		const { apiUrl, redirectUrl } = this.props;
		Auth.signIn(email, password)
			.then(user => {
				if (user.challengeName === "NEW_PASSWORD_REQUIRED") {
					this.setState(updateByPropertyName("user", user));
					this.setState(updateByPropertyName("tempPasswordScreen", true))
				} else {
					localStorage.setItem('email', user.attributes.email);
					localStorage.setItem('accessToken', user.signInUserSession.accessToken.jwtToken);
					var data = qs.stringify({
						'accessToken': user.signInUserSession.accessToken.jwtToken,
						'mail_id': user.attributes.email,
						'firstName': user.attributes.given_name,
						'lastName': user.attributes.family_name
					});
					let config = {
						method: 'post',
						url: apiUrl,
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded'
						},
						data: data
					};
					axios(config)
						.then((response) => {
							console.log("Liferay API Call Success: " + apiUrl);
							console.log("Liferay Redirection after Success Login: " + redirectUrl);
							window.location.href = redirectUrl;
						})
						.catch((error) => {
							console.log("<<<<<<<<<<" + redirectUrl + apiUrl);
						});
				}
			})
			.catch(err => {debugger;
				// const { authError } = this.props;
				// if (err.code === "UserNotConfirmedException") {
				// 	this.changeState("confirmSignUp");
				// } else if (err.code === "PasswordResetRequiredException") {
				// 	this.changeState("requireNewPassword");
				// } else {
				// 	authError(err);
				// }
				this.setState(updateByPropertyName("error", err.message));
			});

		event.preventDefault();
	};

	updateNewPassword() {
		this.setState(updateByPropertyName("error", null));
		if (this.state.confirmPassword === "" && this.state.newPassword === ""){
			this.setState(updateByPropertyName("passwordError", 1));
			return;
		}
		if (this.state.confirmPassword === this.state.newPassword) {
			Auth.completeNewPassword(
				this.state.user,               // the Cognito User Object
				this.state.newPassword
			).then(user => {debugger;
				this.setState(updateByPropertyName("tempPasswordScreen", false));
				this.setState(updateByPropertyName("passwordChangeSuccessMsg", true));
			}).catch(e => {
				this.setState(updateByPropertyName("passwordError", 3));
				this.setState(updateByPropertyName("passwordErrorCognitoMessage", e.message));
			  console.log(e);
			});
		} else {
			this.setState(updateByPropertyName("passwordError", 2));
			return;
		}
	}

	forgotPassword() {
		Auth.forgotPassword("vinusurendran1988@gmail.com")
		.then(data => {
			console.log(data)
		})
		.catch(err => {
			console.log(err)
		});
	}

	render() {
		const { email, password, error } = this.state;

		const isInvalid = password === "" || email === "";

		return (
			<div class="page--signup page--login pt-5" id="content">
				<div class="container">
					<div class="row">
						<div class="col-lg-10 mx-auto">
							<div class="signup-head pb-5">
								<div class="signup-logo pb-3"><img src={this.props.imgUrl} alt="" /></div>
								<h2>Login to Connect Airlines{error}</h2>
							</div>
							<div class="form form--signup form--login mb-5">
								<div class="row">
									<div class="col-md-6">
										{this.state.tempPasswordScreen === false && 
											<div class="page--login__content">
												{error !== null && 
													<div class="alert alert-danger" role="alert">
														{error}
													</div>
												}
												{this.state.passwordChangeSuccessMsg === true && 
													<div class="alert alert-success" role="alert">
														Your new password is updated successfully.
													</div>
												}
												<div class="form-group">
													<div class="input-wrap txt-wrap">
														<input value={email}
															onChange={event =>
																this.setState(updateByPropertyName("email", event.target.value))
															}
															type="text"
															placeholder="Email Address" class="txt" />
													</div>
												</div>
												<div class="form-group">
													<div class="input-wrap password-wrap">
														<input value={password}
															onChange={event =>
																this.setState(
																	updateByPropertyName("password", event.target.value)
																)
															}
															type="password"
															placeholder="Password" class="txt" />
														<i class="toggle-eye fa fa-fw fa-eye-slash"></i>
													</div>
												</div>
												<div class="form-check form-check-inline terms mb-4">
													<input class="form-check-input" type="checkbox" id="inlineCheckbox1" value="option1"></input>
													<label class="form-check-label" for="inlineCheckbox1">Remember me</label>
												</div>
												<div class="btn-wrap mb-3">
													<button onClick={this.onSubmit} type="button" class="btn btn-primary">Login</button>
												</div>
												<div class="text-center">
													<a onClick={() => this.forgotPassword()} href="javascript:void(0)" class="link--forget">Forgot your Password?</a>
												</div>
											</div>
										}
										{this.state.tempPasswordScreen === true &&
											<div class="card">
												<div class="card-header">
													<h3 class="mb-0">Change Password</h3>
												</div>
												<div class="card-body">
													{this.state.passwordError === 2 && 
														<div class="alert alert-danger" role="alert">
															Password missmatch error.
														</div>
													}
													{this.state.passwordError === 1 && 
														<div class="alert alert-danger" role="alert">
															Password cannot be empty.
														</div>
													}
													{this.state.passwordError === 3 && 
														<div class="alert alert-danger" role="alert">
															{this.state.passwordErrorCognitoMessage}
														</div>
													}
													<form class="form" role="form" autocomplete="off">
														<div class="form-group">
															<label for="inputPasswordOld">New Password</label>
															<input autocomplete="off"
																onChange={event =>
																	this.setState(updateByPropertyName("newPassword", event.target.value))
																}
																value={this.state.newPassword} type="password" class="txt" id="inputPasswordOld" required="" />
														</div>
														<div class="form-group">
															<span class="form-text small text-muted">
																<i>Note: The password must contain an uppercase letter a lowercase letter a number and a special character with atleast 8 characters in length.</i>
															</span><br />
															<label for="inputPasswordNew">Confirm Password</label>
															<input autocomplete="off"
																onChange={event =>
																	this.setState(updateByPropertyName("confirmPassword", event.target.value))
																}
																value={this.state.confirmPassword} type="password" class="txt" id="inputPasswordNew" required="" />
														</div>
														<div class="form-group">
															<button type="button" onClick={() => this.updateNewPassword()} class="btn btn-primary">Save</button>
														</div>
													</form>
												</div>
											</div> 
										}
									</div>
									<div class="col-md-6">
										<div class="page--login__join">
											<h3>Sign up</h3>
											<p>Enjoy offers, value added services and earn rewards as an Executive member</p>
											<div class="btn-wrap">
												<button type="button"
													onClick={() => { window.location.href = this.props.signUpPage }}
													class="btn btn-primary">Join now</button>
											</div>
										</div>
									</div>
								</div>
							</div>

						</div>
					</div>
				</div>

			</div>
			// 	  </body>
			// </div>
		);
	}
}

export default Login;
