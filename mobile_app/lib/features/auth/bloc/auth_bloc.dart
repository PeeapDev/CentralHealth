import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../data/auth_service.dart';
import '../data/models/auth_models.dart';

// Events
abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class LoginRequested extends AuthEvent {
  final String email;
  final String password;

  const LoginRequested({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}

class RegisterRequested extends AuthEvent {
  final String email;
  final String password;
  final String name;

  const RegisterRequested({
    required this.email,
    required this.password,
    required this.name,
  });

  @override
  List<Object?> get props => [email, password, name];
}

class LogoutRequested extends AuthEvent {}

// Removed SetUserRole event - this is now a patient-only app

class CheckAuthStatus extends AuthEvent {}

// States
abstract class AuthState extends Equatable {
  final String? role;
  
  const AuthState({this.role});

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {
  const AuthInitial() : super(role: null);
  
  @override
  List<Object?> get props => [];
}

class AuthLoading extends AuthState {
  const AuthLoading({String? role}) : super(role: role);
  
  @override
  List<Object?> get props => [role];
}

class Authenticated extends AuthState {
  final String userId;
  final String token;

  const Authenticated({
    required this.userId, 
    required this.token,
    String? role,
  }) : super(role: role);

  @override
  List<Object?> get props => [userId, token, role];
}

class Unauthenticated extends AuthState {
  const Unauthenticated({String? role}) : super(role: role);
  
  @override
  List<Object?> get props => [role];
}

class AuthError extends AuthState {
  final String message;

  const AuthError(this.message, {String? role}) : super(role: role);

  @override
  List<Object?> get props => [message, role];
}

// BLoC
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthService _authService;
  // Always use patient role in this patient-only app
  final String _selectedRole = 'patient';

  AuthBloc(this._authService) : super(AuthInitial()) {
    on<LoginRequested>(_onLoginRequested);
    on<RegisterRequested>(_onRegisterRequested);
    on<LogoutRequested>(_onLogoutRequested);
    on<CheckAuthStatus>(_onCheckAuthStatus);
    // This is a patient-only app, no role selection needed
  }
  
  // Patient-only app, removed _onSetUserRole handler

  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(AuthLoading());
      final user = await _authService.login(
        LoginRequest(
          email: event.email,
          password: event.password,
        ),
      );
      emit(Authenticated(
        userId: user.id,
        token: user.accessToken,
        role: state.role,
      ));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onRegisterRequested(
    RegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(AuthLoading());
      final user = await _authService.register(
        RegisterRequest(
          email: event.email,
          password: event.password,
          name: event.name,
        ),
      );
      emit(Authenticated(
        userId: user.id,
        token: user.accessToken,
        role: state.role,
      ));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(AuthLoading());
      await _authService.logout();
      emit(Unauthenticated());
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    try {
      emit(AuthLoading());
      final user = await _authService.getCurrentUser();
      if (user != null) {
        emit(Authenticated(
          userId: user.id,
          token: user.accessToken,
          role: user.role,
        ));
      } else {
        emit(Unauthenticated());
      }
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }
}
