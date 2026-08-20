import { Component } from "react"
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react"
import Button from "./Button"

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="max-w-md w-full text-center space-y-5">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Something went wrong
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {this.props.sectionName
                  ? `An error occurred while loading the ${this.props.sectionName} section.`
                  : "An unexpected error occurred while rendering this page."}
              </p>
              {this.state.error?.message && (
                <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-2 mt-2 break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={this.handleReset}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Try again
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => (window.location.href = "/provider/dashboard")}
              >
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
