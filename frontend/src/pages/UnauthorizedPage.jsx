import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '../components/ui'

const UnauthorizedPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-white mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2">403</h1>
        <p className="text-xl text-indigo-100 mb-4">Access Denied</p>
        <p className="text-indigo-100 mb-8 max-w-md">
          You don't have permission to access this resource. If you believe this is an error, please contact your administrator.
        </p>
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="text-white hover:text-indigo-600"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}

export default UnauthorizedPage
